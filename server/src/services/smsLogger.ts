import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

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
	numSegments: string;
}

export interface UpdatedSmsRecord extends SmsRecord {
	dateSent: string;
	price: string;
	priceUnit: string;
	errorCode: string;
	errorMessage: string;
}

export interface SmsLogger {
	log(record: SmsRecord): Promise<void>;
	getLogs(): Promise<SmsRecord[]>;
	getLogFilePath(): string;
}

const CSV_HEADER =
	'surveyCode,phone,templateName,smsText,datetime,status,twilioSid,numSegments';

const UPDATED_CSV_HEADER =
	'surveyCode,phone,templateName,smsText,datetime,status,twilioSid,numSegments,' +
	'dateSent,price,priceUnit,errorCode,errorMessage';

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
		escapeCsvField(record.twilioSid),
		escapeCsvField(record.numSegments)
	].join(',');
}

function updatedRecordToCsvRow(record: UpdatedSmsRecord): string {
	return [
		escapeCsvField(record.surveyCode),
		escapeCsvField(record.phone),
		escapeCsvField(record.templateName),
		escapeCsvField(record.smsText),
		escapeCsvField(record.datetime),
		escapeCsvField(record.status),
		escapeCsvField(record.twilioSid),
		escapeCsvField(record.numSegments),
		escapeCsvField(record.dateSent),
		escapeCsvField(record.price),
		escapeCsvField(record.priceUnit),
		escapeCsvField(record.errorCode),
		escapeCsvField(record.errorMessage)
	].join(',');
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
		return parse(content, {
			columns: true,
			skip_empty_lines: true,
			relax_column_count: true,
			cast: false
		}) as SmsRecord[];
	}
}

export class UpdatedCsvSmsLogger {
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

	async log(record: UpdatedSmsRecord): Promise<void> {
		const fileExists = fs.existsSync(this.filePath);
		const row = updatedRecordToCsvRow(record);

		if (!fileExists) {
			fs.writeFileSync(
				this.filePath,
				UPDATED_CSV_HEADER + '\n' + row + '\n'
			);
		} else {
			fs.appendFileSync(this.filePath, row + '\n');
		}
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
			const records = parse(content, {
				columns: true,
				skip_empty_lines: true,
				relax_column_count: true,
				cast: false
			}) as unknown[];
			return {
				filename,
				rows: records.length
			};
		});
}
