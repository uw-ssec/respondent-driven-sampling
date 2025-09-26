import jwt from 'jsonwebtoken';

const tokenSecret = process.env.AUTH_SECRET as string;

// Generates the JSON Web Token to be used by the client, a client having a valid JWT
// means that they should be atleast a volunteer in role and must have been approved
// by an admin.
export function generateAuthToken(
	firstName: string,
	role: string,
	employeeId: string
): string {
	return jwt.sign(
		{
			firstName: firstName,
			role: role,
			employeeId: employeeId
		},
		tokenSecret,
		{ expiresIn: '12h' }
	);
}

// Verifies the JSON Web Token and returns the decoded payload
export function verifyAuthToken(token: string): any {
	return jwt.verify(token, tokenSecret);
}
