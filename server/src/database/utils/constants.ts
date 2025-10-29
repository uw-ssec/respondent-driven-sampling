// ---- SURVEY CONSTANTS ----

export const SYSTEM_SURVEY_CODE = '_SEED_';
export const GENERATED_SURVEY_CODES_LENGTH = 3;
export const SURVEY_CODE_LENGTH = 8;

// ---- LOCATION CONSTANTS ----

export enum HubType {
	ESTABLISHMENT = 'ESTABLISHMENT',
	STREET_ADDRESS = 'STREET_ADDRESS',
	PREMISE = 'PREMISE',
	CHURCH = 'CHURCH',
	LOCALITY = 'LOCALITY'
}

export enum LocationType {
	ROOFTOP = 'ROOFTOP',
	APPROXIMATE = 'APPROXIMATE'
}

// ---- USER CONSTANTS ----

export enum ApprovalStatus {
	PENDING = 'PENDING',
	APPROVED = 'APPROVED',
	REJECTED = 'REJECTED'
}

export enum Role {
	VOLUNTEER = 'VOLUNTEER',
	MANAGER = 'MANAGER',
	ADMIN = 'ADMIN',
	SUPER_ADMIN = 'SUPER_ADMIN' // super admin de-prioritized for now
}
