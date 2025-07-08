export interface User {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: 'Admin' | 'Manager' | 'Volunteer' | '';
	employeeId: string;
	[key: string]: any; // For any additional dynamic fields
}
