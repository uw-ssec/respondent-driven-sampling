const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const tokenSecret = process.env.AUTH_SECRET;

// Generates the JSON Web Token to be used by the client, a client having a valid JWT
// means that they should be atleast a volunteer in role and must have been approved
// by an admin.
function generateAuthToken(firstName, role, employeeId) {
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
function verifyAuthToken(token) {
	return jwt.verify(token, tokenSecret);
}

module.exports = {
	generateAuthToken,
	verifyAuthToken
};