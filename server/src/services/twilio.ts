import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID as string;
const authToken = process.env.TWILIO_AUTH_TOKEN as string;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER as string;

const client = twilio(accountSid, authToken);

export interface SmsSendResult {
	sid: string;
	status: string;
	errorCode: string | null;
	errorMessage: string | null;
	numSegments: string;
}

/**
 * Send a single SMS via Twilio.
 */
export async function sendSms(
	to: string,
	body: string
): Promise<SmsSendResult> {
	if (!twilioPhoneNumber) {
		throw new Error(
			'TWILIO_PHONE_NUMBER is not configured. Set it in your .env file.'
		);
	}

	const message = await client.messages.create({
		to,
		from: twilioPhoneNumber,
		body
	});

	return {
		sid: message.sid,
		status: message.status,
		errorCode: message.errorCode ? String(message.errorCode) : null,
		errorMessage: message.errorMessage ?? null,
		numSegments: message.numSegments
	};
}

/**
 * Fetch the current status of a sent message by its Twilio SID.
 * Uses the Twilio Messages API: client.messages(sid).fetch()
 * Returns the latest status (e.g. "queued", "sent", "delivered", "undelivered", "failed").
 */
export interface MessageStatusResult {
	sid: string;
	status: string;
	dateUpdated: Date | null;
	dateSent: Date | null;
	errorCode: number | null;
	errorMessage: string | null;
	price: string | null;
	priceUnit: string | null;
	numSegments: string;
	direction: string;
}

export async function fetchMessageStatus(
	sid: string
): Promise<MessageStatusResult> {
	const message = await client.messages(sid).fetch();
	return {
		sid: message.sid,
		status: message.status,
		dateUpdated: message.dateUpdated,
		dateSent: message.dateSent ?? null,
		errorCode: message.errorCode ?? null,
		errorMessage: message.errorMessage ?? null,
		price: message.price ?? null,
		priceUnit: message.priceUnit ?? null,
		numSegments: message.numSegments,
		direction: message.direction
	};
}

export interface OutboundMessageRecord {
	sid: string;
	to: string;
	body: string;
	status: string;
	dateSent: Date | null;
	dateCreated: Date | null;
	numSegments: string;
	direction: string;
	errorCode: number | null;
	errorMessage: string | null;
	price: string | null;
	priceUnit: string | null;
}

/**
 * List all outbound messages sent from our Twilio number.
 * Filters to direction === 'outbound-api' to exclude inbound replies.
 */
export async function listOutboundMessages(options?: {
	dateSentAfter?: Date;
	dateSentBefore?: Date;
}): Promise<OutboundMessageRecord[]> {
	if (!twilioPhoneNumber) {
		throw new Error(
			'TWILIO_PHONE_NUMBER is not configured. Set it in your .env file.'
		);
	}

	const messages = await client.messages.list({
		from: twilioPhoneNumber,
		...(options?.dateSentAfter && { dateSentAfter: options.dateSentAfter }),
		...(options?.dateSentBefore && {
			dateSentBefore: options.dateSentBefore
		})
	});

	return messages
		.filter(m => m.direction === 'outbound-api')
		.map(m => ({
			sid: m.sid,
			to: m.to,
			body: m.body,
			status: m.status,
			dateSent: m.dateSent ?? null,
			dateCreated: m.dateCreated ?? null,
			numSegments: m.numSegments,
			direction: m.direction,
			errorCode: m.errorCode ?? null,
			errorMessage: m.errorMessage ?? null,
			price: m.price ?? null,
			priceUnit: m.priceUnit ?? null
		}));
}

/**
 * Normalizes a US phone number from various formats to E.164 (+1XXXXXXXXXX).
 * Handles: (555) 123-4567, 555-123-4567, 5551234567, +15551234567, etc.
 * @throws Error if the phone number is not a valid 10-digit US number
 */
export function normalizePhoneToE164(phone: string): string {
	const digits = phone.replace(/\D/g, '');

	if (digits.length === 11 && digits.startsWith('1')) {
		return `+${digits}`;
	}

	if (digits.length === 10) {
		return `+1${digits}`;
	}

	throw new Error(
		`Invalid phone number: cannot normalize "${phone}" to E.164 format`
	);
}

/**
 * Interpolate template variables. Replaces {varName} placeholders with values.
 * @throws Error if a required variable is missing from the provided values.
 */
export function interpolateTemplate(
	templateBody: string,
	variables: Record<string, string>
): string {
	return templateBody.replace(/\{(\w+)\}/g, (_match, varName) => {
		if (varName in variables) {
			return variables[varName];
		}
		throw new Error(`Missing template variable: {${varName}}`);
	});
}
