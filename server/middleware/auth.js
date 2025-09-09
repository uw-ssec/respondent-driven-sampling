const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const { User } = require('../models/Users');
const { verifyAuthToken } = require('../utils/authTokenHandler');
const httpMessages = require('../messages');

// Middleware for verifying token signature and storing token info in response
// If this call passes to the next handler, it means the user is atleast a volunteer
// and has been approved by an admin.
async function auth(req, res, next) {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token)
		return res
			.status(401)
			.json({ message: httpMessages.err_missing_token });

	try {
		const decodedAuthToken = verifyAuthToken(token);
		req.decodedAuthToken = decodedAuthToken;

		// Checking if the user's account is approved
		const user = await User.findOne({
			employeeId: decodedAuthToken.employeeId
		});
		if (!user) {
			// This case means that the user has a valid JWT signed by our server but
			// the account it is linked to does not exist in our database.
			return res.status(404).json({
				message: httpMessages.err_account_not_found
			});
		}
		if (user.approvalStatus !== 'Approved') {
			return res.status(403).json({
				message: httpMessages.err_unapproved_account
			});
		}
		// Add permission list to request and user id
		req.permissions = user.permissions;
		req.requestorID = user.id;
		next();
	} catch (err) {
		return res.status(401).json({ message: `Invalid Token: ${err.name}` });
	}
}

module.exports = {
	auth
};
