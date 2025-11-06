import { ROLE_ENUM } from '@/permissions/constants';

export interface User {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: (typeof ROLE_ENUM)[number];
	[key: string]: any; // For any additional dynamic fields
}
