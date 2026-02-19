import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SMS_LOGS_DIR = path.join(__dirname, '../scripts/sms-logs');

export interface SmsRecord {
	surveyCode: string;
	phone: string;
	templateName: string;
	smsText: string;
	datetime: string;
	status: string;
	twilioSid: string;
}

export interface SmsLogger {
	log(record: SmsRecord): Promise<void>;
	getLogs(): Promise<SmsRecord[]>;
	getLogFilePath(): string;
}

const CSV_HEADER =
	'surveyCode,phone,templateName,smsText,datetime,status,twilioSid';

function escapeCsvField(value: string): string {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function recordToCsvRow(record: SmsRecord): string {
	return [
		escapeCsvField(record.surveyCode),
		escapeCsvField(record.phone),
		escapeCsvField(record.templateName),
		escapeCsvField(record.smsText),
		escapeCsvField(record.datetime),
		escapeCsvField(record.status),
		escapeCsvField(record.twilioSid)
	].join(',');
}

function parseCsvRow(row: string): SmsRecord | null {
	// Simple CSV parser that handles quoted fields
	const fields: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < row.length; i++) {
		const char = row[i];
		if (inQuotes) {
			if (char === '"' && row[i + 1] === '"') {
				current += '"';
				i++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				current += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === ',') {
				fields.push(current);
				current = '';
			} else {
				current += char;
			}
		}
	}
	fields.push(current);

	if (fields.length < 7) return null;

	return {
		surveyCode: fields[0],
		phone: fields[1],
		templateName: fields[2],
		smsText: fields[3],
		datetime: fields[4],
		status: fields[5],
		twilioSid: fields[6]
	};
}

export class CsvSmsLogger implements SmsLogger {
	private filePath: string;

	constructor(filename: string) {
		if (!fs.existsSync(SMS_LOGS_DIR)) {
			fs.mkdirSync(SMS_LOGS_DIR, { recursive: true });
		}
		this.filePath = path.join(SMS_LOGS_DIR, filename);
	}

	getLogFilePath(): string {
		return this.filePath;
	}

	async log(record: SmsRecord): Promise<void> {
		const fileExists = fs.existsSync(this.filePath);
		const row = recordToCsvRow(record);

		if (!fileExists) {
			fs.writeFileSync(this.filePath, CSV_HEADER + '\n' + row + '\n');
		} else {
			fs.appendFileSync(this.filePath, row + '\n');
		}
	}

	async getLogs(): Promise<SmsRecord[]> {
		if (!fs.existsSync(this.filePath)) {
			return [];
		}

		const content = fs.readFileSync(this.filePath, 'utf-8');
		const lines = content.split('\n').filter(line => line.trim() !== '');

		// Skip header row
		return lines
			.slice(1)
			.map(parseCsvRow)
			.filter((record): record is SmsRecord => record !== null);
	}
}

/**
 * List all CSV log files in the sms-logs directory with row counts.
 */
export function listLogFiles(): { filename: string; rows: number }[] {
	if (!fs.existsSync(SMS_LOGS_DIR)) {
		return [];
	}

	return fs
		.readdirSync(SMS_LOGS_DIR)
		.filter(f => f.endsWith('.csv'))
		.map(filename => {
			const filePath = path.join(SMS_LOGS_DIR, filename);
			const content = fs.readFileSync(filePath, 'utf-8');
			const lines = content
				.split('\n')
				.filter(line => line.trim() !== '');
			return {
				filename,
				rows: Math.max(0, lines.length - 1) // subtract header
			};
		});
}
