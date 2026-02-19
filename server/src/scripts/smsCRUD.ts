#!/usr/bin/env tsx

/**
 * Script to send automated SMS messages via Twilio
 * Usage: npm run sms -- <operation> [args]
 *
 * Operations:
 *   list-recipients [--location <locationId>]
 *     List all survey respondents who provided a phone number.
 *     Example: npm run sms -- list-recipients
 *     Example: npm run sms -- list-recipients --location 507f1f77bcf86cd799439011
 *
 *   send <phone> --template <name> [--var key=value ...]
 *     Send a single SMS using a YAML template with variable substitution.
 *     Example: npm run sms -- send "(206) 555-1234" --template gift_card --var surveyCode=ABC123
 *
 *   send <phone> --body "raw message text"
 *     Send a single SMS with a raw message body (no template).
 *     Example: npm run sms -- send "+15551234567" --body "Hello from the PIT Count team!"
 *
 *   send-bulk --template <name> [--location <locationId>] [--dry-run]
 *     Send SMS to all respondents who provided a phone number, using a template.
 *     Variables (surveyCode, etc.) are auto-populated from survey data.
 *     Example: npm run sms -- send-bulk --template gift_card
 *     Example: npm run sms -- send-bulk --template gift_card --dry-run
 *     Example: npm run sms -- send-bulk --template gift_card --location 507f1f77bcf86cd799439011
 *
 *   logs
 *     List all CSV log files in sms-logs/ directory with row counts.
 *     Example: npm run sms -- logs
 */
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import mongoose from 'mongoose';
import { parse as parseYaml } from 'yaml';

import connectDB from '@/database';
import Survey from '@/database/survey/mongoose/survey.model';
import {
	sendSms,
	normalizePhoneToE164,
	interpolateTemplate
} from '@/services/twilio';
import { CsvSmsLogger, listLogFiles } from '@/services/smsLogger';
import type { SmsRecord } from '@/services/smsLogger';

// ===== Template Loading =====

interface SmsTemplate {
	name: string;
	description: string;
	body: string;
}

const TEMPLATES_DIR = path.join(
	path.dirname(new URL(import.meta.url).pathname),
	'sms-templates'
);

function loadTemplate(templateName: string): SmsTemplate {
	const filePath = path.join(TEMPLATES_DIR, `${templateName}.yaml`);

	if (!fs.existsSync(filePath)) {
		const available = fs
			.readdirSync(TEMPLATES_DIR)
			.filter(f => f.endsWith('.yaml'))
			.map(f => f.replace('.yaml', ''));
		throw new Error(
			`Template "${templateName}" not found at ${filePath}\n` +
				`Available templates: ${available.length > 0 ? available.join(', ') : '(none)'}`
		);
	}

	const content = fs.readFileSync(filePath, 'utf-8');
	const parsed = parseYaml(content) as SmsTemplate;

	if (!parsed.name || !parsed.body) {
		throw new Error(
			`Template "${templateName}" is missing required fields (name, body)`
		);
	}

	return parsed;
}

// ===== Recipient Queries =====

interface Recipient {
	phone: string;
	surveyCode: string;
	surveyObjectId: string;
}

async function getRecipients(locationObjectId?: string): Promise<Recipient[]> {
	const query: Record<string, unknown> = {
		'responses.phone': { $exists: true, $ne: '' },
		deletedAt: null
	};

	if (locationObjectId) {
		query.locationObjectId = new mongoose.Types.ObjectId(locationObjectId);
	}

	const surveys = await Survey.find(query).select({
		'responses.phone': 1,
		surveyCode: 1,
		_id: 1
	});

	return surveys.map(s => ({
		phone: (s.responses as Record<string, string>).phone,
		surveyCode: s.surveyCode,
		surveyObjectId: s._id.toString()
	}));
}

// ===== Operations =====

async function listRecipients(locationObjectId?: string): Promise<void> {
	console.log('\n📱 Listing survey respondents with phone numbers...\n');

	const recipients = await getRecipients(locationObjectId);

	if (recipients.length === 0) {
		console.log('No respondents with phone numbers found.');
		return;
	}

	console.log(`Found ${recipients.length} respondent(s):\n`);

	for (const r of recipients) {
		console.log(`  ${r.phone}  (surveyCode: ${r.surveyCode})`);
	}
	console.log('');
}

async function sendSingle(
	phone: string,
	options: {
		templateName?: string;
		body?: string;
		vars: Record<string, string>;
	}
): Promise<void> {
	console.log('\n📤 Sending single SMS...\n');

	let messageBody: string;
	let templateName: string;

	if (options.templateName) {
		const template = loadTemplate(options.templateName);
		templateName = template.name;
		messageBody = interpolateTemplate(template.body, options.vars);
	} else if (options.body) {
		templateName = '(raw)';
		messageBody = options.body;
	} else {
		throw new Error('Either --template or --body must be provided');
	}

	const normalizedPhone = normalizePhoneToE164(phone);
	console.log(`  To: ${phone} → ${normalizedPhone}`);
	console.log(`  Template: ${templateName}`);
	console.log(`  Message: ${messageBody}`);
	console.log('');

	const result = await sendSms(normalizedPhone, messageBody);

	console.log(`  ✓ SMS sent! Twilio SID: ${result.sid}`);
	console.log(`  Status: ${result.status}`);
	if (result.errorCode) {
		console.log(`  Error: ${result.errorCode} - ${result.errorMessage}`);
	}

	// Log to CSV
	const logger = new CsvSmsLogger('sms-log-single.csv');
	const record: SmsRecord = {
		surveyCode: options.vars.surveyCode ?? '',
		phone: normalizedPhone,
		templateName,
		smsText: messageBody,
		datetime: new Date().toISOString(),
		status: result.status,
		twilioSid: result.sid
	};
	await logger.log(record);
	console.log(`  Logged to: ${logger.getLogFilePath()}`);
}

async function sendBulk(options: {
	templateName: string;
	locationObjectId?: string;
	dryRun: boolean;
}): Promise<void> {
	const mode = options.dryRun ? '🔍 DRY RUN' : '📤 SENDING';
	console.log(`\n${mode} — Bulk SMS...\n`);

	const template = loadTemplate(options.templateName);
	const recipients = await getRecipients(options.locationObjectId);

	if (recipients.length === 0) {
		console.log('No respondents with phone numbers found. Nothing to send.');
		return;
	}

	console.log(`Template: ${template.name}`);
	console.log(`Recipients: ${recipients.length}`);
	console.log(`Message template: ${template.body}`);
	console.log('');

	if (options.dryRun) {
		console.log('--- Dry run preview ---\n');
		for (const r of recipients) {
			try {
				const normalizedPhone = normalizePhoneToE164(r.phone);
				const variables: Record<string, string> = {
					surveyCode: r.surveyCode
				};
				const renderedBody = interpolateTemplate(
					template.body,
					variables
				);
				console.log(
					`  ✓ ${r.phone} → ${normalizedPhone}: "${renderedBody}"`
				);
			} catch (err) {
				console.log(
					`  ✗ ${r.phone}: ${err instanceof Error ? err.message : err}`
				);
			}
		}
		console.log(
			`\n--- Dry run complete. ${recipients.length} message(s) would be sent. ---`
		);
		return;
	}

	// Actual send
	const batchId = randomBytes(8).toString('hex').toUpperCase();
	const date = new Date().toISOString().split('T')[0];
	const logFilename = `sms-log-${date}-${template.name}.csv`;
	const logger = new CsvSmsLogger(logFilename);

	let successCount = 0;
	let failCount = 0;

	for (let i = 0; i < recipients.length; i++) {
		const r = recipients[i];
		const index = i + 1;

		try {
			const normalizedPhone = normalizePhoneToE164(r.phone);
			const variables: Record<string, string> = {
				surveyCode: r.surveyCode
			};
			const renderedBody = interpolateTemplate(
				template.body,
				variables
			);

			const result = await sendSms(normalizedPhone, renderedBody);

			const record: SmsRecord = {
				surveyCode: r.surveyCode,
				phone: normalizedPhone,
				templateName: template.name,
				smsText: renderedBody,
				datetime: new Date().toISOString(),
				status: result.status,
				twilioSid: result.sid
			};
			await logger.log(record);

			successCount++;
			console.log(
				`  ✓ [${index}/${recipients.length}] ${r.phone} → ${normalizedPhone} (SID: ${result.sid})`
			);

			if (result.errorCode) {
				console.log(
					`    Warning: ${result.errorCode} - ${result.errorMessage}`
				);
			}
		} catch (err) {
			failCount++;
			const errorMessage =
				err instanceof Error ? err.message : String(err);
			console.log(
				`  ✗ [${index}/${recipients.length}] ${r.phone}: ${errorMessage}`
			);

			// Log failures too
			const record: SmsRecord = {
				surveyCode: r.surveyCode,
				phone: r.phone,
				templateName: template.name,
				smsText: '',
				datetime: new Date().toISOString(),
				status: 'failed',
				twilioSid: ''
			};
			await logger.log(record);
		}

		// Rate limiting: 1.1s delay between messages (Twilio long-code limit: 1 msg/sec)
		if (i < recipients.length - 1) {
			await new Promise(resolve => setTimeout(resolve, 1100));
		}
	}

	console.log('\n' + '='.repeat(50));
	console.log('Bulk SMS Summary:');
	console.log(`  Batch ID: ${batchId}`);
	console.log(`  ✓ Sent: ${successCount}`);
	console.log(`  ✗ Failed: ${failCount}`);
	console.log(`  Log file: ${logger.getLogFilePath()}`);
}

function showLogs(): void {
	console.log('\n📋 SMS Log Files\n');

	const logFiles = listLogFiles();

	if (logFiles.length === 0) {
		console.log('No log files found.');
		return;
	}

	for (const { filename, rows } of logFiles) {
		console.log(`  ${filename}  (${rows} message${rows !== 1 ? 's' : ''})`);
	}
	console.log('');
}

// ===== Argument Parsing Helpers =====

function getFlag(args: string[], flag: string): string | undefined {
	const index = args.indexOf(flag);
	if (index === -1 || index + 1 >= args.length) return undefined;
	return args[index + 1];
}

function hasFlag(args: string[], flag: string): boolean {
	return args.includes(flag);
}

function getVars(args: string[]): Record<string, string> {
	const vars: Record<string, string> = {};
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--var' && i + 1 < args.length) {
			const pair = args[i + 1];
			const eqIndex = pair.indexOf('=');
			if (eqIndex === -1) {
				throw new Error(
					`Invalid --var format: "${pair}". Expected key=value`
				);
			}
			vars[pair.slice(0, eqIndex)] = pair.slice(eqIndex + 1);
			i++;
		}
	}
	return vars;
}

// ===== Main =====

async function main(): Promise<void> {
	try {
		const args = process.argv.slice(2);

		if (args.length === 0) {
			printUsage();
			process.exit(1);
		}

		const operation = args[0].toLowerCase();

		// 'logs' doesn't need DB connection
		if (operation === 'logs') {
			showLogs();
			return;
		}

		console.log('Connecting to database...');
		await connectDB();
		console.log('Connected to database ✓');

		switch (operation) {
			case 'list-recipients': {
				const locationId = getFlag(args, '--location');
				await listRecipients(locationId);
				break;
			}

			case 'send': {
				if (args.length < 2) {
					console.error(
						'Error: send requires a phone number argument'
					);
					process.exit(1);
				}
				const phone = args[1];
				const templateName = getFlag(args, '--template');
				const body = getFlag(args, '--body');
				const vars = getVars(args);

				await sendSingle(phone, { templateName, body, vars });
				break;
			}

			case 'send-bulk': {
				const templateName = getFlag(args, '--template');
				if (!templateName) {
					console.error('Error: send-bulk requires --template <name>');
					process.exit(1);
				}
				const locationObjectId = getFlag(args, '--location');
				const dryRun = hasFlag(args, '--dry-run');

				await sendBulk({ templateName, locationObjectId, dryRun });
				break;
			}

			default:
				console.error(`Error: Unknown operation "${operation}"`);
				printUsage();
				process.exit(1);
		}
	} catch (error) {
		console.error(
			'\n✗ Error:',
			error instanceof Error ? error.message : error
		);
		process.exit(1);
	} finally {
		if (mongoose.connection.readyState === 1) {
			await mongoose.connection.close();
			console.log('\nDatabase connection closed.');
		}
		process.exit(0);
	}
}

function printUsage(): void {
	console.log(`
Usage: npm run sms -- <operation> [args]

Operations:

  list-recipients [--location <locationId>]
    List all survey respondents who provided a phone number.
    Example: npm run sms -- list-recipients
    Example: npm run sms -- list-recipients --location 507f1f77bcf86cd799439011

  send <phone> --template <name> [--var key=value ...]
    Send a single SMS using a YAML template with variable substitution.
    Example: npm run sms -- send "(206) 555-1234" --template gift_card --var surveyCode=ABC123

  send <phone> --body "raw message text"
    Send a single SMS with a raw message body (no template).
    Example: npm run sms -- send "+15551234567" --body "Hello from the PIT Count team!"

  send-bulk --template <name> [--location <locationId>] [--dry-run]
    Send SMS to all respondents who provided a phone number, using a template.
    Variables (surveyCode, etc.) are auto-populated from survey data.
    --dry-run shows what would be sent without actually sending.
    Example: npm run sms -- send-bulk --template gift_card
    Example: npm run sms -- send-bulk --template gift_card --dry-run
    Example: npm run sms -- send-bulk --template gift_card --location 507f1f77bcf86cd799439011

  logs
    List all CSV log files in sms-logs/ directory with row counts.
    Example: npm run sms -- logs
	`);
}

main();
