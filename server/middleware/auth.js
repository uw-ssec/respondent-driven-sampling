const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const User = require('../models/Users');
const { verifyAuthToken } = require('../utils/authTokenHandler');

// Middleware for verifying token signature and storing token info in response
// If this call passes to the next handler, it means the user is atleast a volunteer
// and has been approved by an admin.
async function auth(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token)
		return res
			.status(401)
			.json({ message: 'Access denied. No token provided' });

	try {
		const decodedAuthToken = verifyAuthToken(token);
		req.decodedAuthToken = decodedAuthToken;

		// Checking if the user's account is approved
		const user = await User.findOne({
			employeeId: decodedAuthToken.employeeId
		});
		console.log(user);
		if (!user) {
			// This case means that the user has a valid JWT signed by our server but
			// the account it is linked to does not exist in our database.
			return res.status(400).json({
				message: 'User account not found. Please contact your admin.'
			});
		}
		if (user.approvalStatus !== 'Approved') {
			return res.status(403).json({
				message:
					'User account not approved yet. Please contact your admin.'
			});
		}
		next();
	} catch (err) {
		return res.status(401).json({ message: `Invalid Token: ${err.name}` });
	}
}

module.exports = {
	auth
};
