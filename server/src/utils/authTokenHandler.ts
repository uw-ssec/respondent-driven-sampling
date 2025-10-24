import jwt from 'jsonwebtoken';

// Get the token secret dynamically to support testing environment
function getTokenSecret(): string {
	const secret = process.env.AUTH_SECRET;
	if (!secret) {
		throw new Error('AUTH_SECRET environment variable is not set');
	}
	return secret;
}

// Generates the JSON Web Token to be used by the client, a client having a valid JWT
// means that they should be atleast a volunteer in role and must have been approved
// by an admin.
export function generateAuthToken(
	firstName: string,
	role: string,
	userObjectId: string
): string {
	return jwt.sign(
		{
			firstName: firstName,
			role: role,
			userObjectId: userObjectId
		},
		getTokenSecret(),
		{ expiresIn: '12h' }
	);
}

// Verifies the JSON Web Token and returns the decoded payload
export function verifyAuthToken(token: string): any {
	return jwt.verify(token, getTokenSecret());
}
