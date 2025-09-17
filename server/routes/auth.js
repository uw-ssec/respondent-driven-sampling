const express = require('express');
const router = express.Router();
const { User, role_values } = require('../models/Users');
const { generateAuthToken } = require('../utils/authTokenHandler');
const { auth } = require('../middleware/auth');
const {generateEmployeeId, roleToNumberMap, hasPermission, validPermList, getDefaultPermissions } = require('../utils/userUtils');
const httpMessages = require('../messages');

const twilio = require('twilio');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

const client = twilio(accountSid, authToken);
const verifyService = client.verify.v2.services(verifySid);

// ─── Send OTP for SIGNUP ────────────────────────────────────────────
router.post('/send-otp-signup', async (req, res) => {
	try {
		const { phone, email } = req.body;
		if (!phone || !email) {
			return res.status(400).json({ message: httpMessages.err_missing_fields });
		}

		const existingUser = await User.findOne({
			$or: [{ phone }, { email }]
		});
		if (existingUser) {
			return res
				.status(400)
				.json({ message: httpMessages.err_user_exist_login });
		}

		await verifyService.verifications.create({ to: phone, channel: 'sms' });
		res.json({ message: httpMessages.success_otp });
	} catch (err) {
		console.error('Send OTP signup error:', err);
		res.status(500).json({ message: 'Failed to send OTP' });
	}
});

// ─── Send OTP for LOGIN ─────────────────────────────────────────────
router.post('/send-otp-login', async (req, res) => {
	try {
		const { phone, email } = req.body;
		if (!phone || !email) {
			return res.status(400).json({ message: httpMessages.err_missing_fields });
		}

		const user = await User.findOne({ email, phone });
		if (!user) {
			return res.status(404).json({ message: httpMessages.err_user_not_exist });
		}
		await verifyService.verifications.create({ to: phone, channel: 'sms' });
		res.json({ message: httpMessages.success_otp });
	} catch (err) {
		console.error('Send OTP login error:', err);
		res.status(500).json({ message: 'Failed to send OTP' });
	}
});

// ─── Verify OTP for SIGNUP ──────────────────────────────────────────
router.post('/verify-otp-signup', async (req, res) => {
	try {
		const { phone, code, firstName, lastName, email, role } = req.body;
		if (!phone || !code || !firstName || !lastName || !email || !role)
			return res.status(400).json({ message: httpMessages.err_missing_fields });

		const check = await verifyService.verificationChecks.create({
			to: phone,
			code
		});
		if (check.status !== 'approved')
			return res.status(400).json({ message: httpMessages.err_invalid_otp });
		if (await User.findOne({ phone }))
			return res.status(400).json({ message: httpMessages.err_user_exist_login });

    	// Gets default permissions for role, checks if no permissions were given
		// meaning the given role is invalid.
		const permissions = getDefaultPermissions(role);
		if (permissions == [])
			return res.status(400).json({ message: httpMessages.err_invalid_fields });
		const employeeId = await generateEmployeeId();
		const newUser = new User({ employeeId, firstName, lastName, email, phone, role, permissions });
		await newUser.save();
		const token = generateAuthToken(
			newUser.firstName,
			newUser.role,
			newUser.employeeId
		);

		res.json({
			message: httpMessages.success_signup,
			token: token,
			redirectTo: '/dashboard'
		});
	} catch (err) {
		console.error('Verify OTP signup error:', err);
		res.status(500).json({ message: 'Failed to verify OTP during signup' });
	}
});

// ─── Verify OTP for LOGIN ───────────────────────────────────────────
router.post('/verify-otp-login', async (req, res) => {
	try {
		const { phone, code } = req.body;
		if (!phone || !code) {
			return res.status(400).json({ message: httpMessages.err_missing_fields });
		}

		const check = await verifyService.verificationChecks.create({
			to: phone,
			code
		});
		if (check.status !== 'approved') {
			return res.status(400).json({ message: httpMessages.err_invalid_otp });
		}

		const user = await User.findOne({ phone });
		if (!user) {
			return res.status(404).json({
				message: httpMessages.err_phone_not_found
			});
		}
		if (user.approvalStatus !== 'Approved') {
			return res.status(403).json({
				message: httpMessages.err_unapproved_account
			});
		}
		const token = generateAuthToken(
			user.firstName,
			user.role,
			user.employeeId
		);

		res.json({
			message: httpMessages.success_login,
			token: token,
			permissions: user.permissions,
			redirectTo: '/dashboard'
		});
	} catch (err) {
		console.error('Verify OTP login error:', err);
		res.status(500).json({ message: 'Failed to verify OTP during login' });
	}
});

// ─── Admin Approvals ────────────────────────────────────────────────
router.get('/users', [auth], async (req, res) => {
	try {
		if (!hasPermission(req.permissions, 'view_profile', 'All')) {
			return res.status(403).json({ message: httpMessages.err_invalid_perms});
		}
		const users = await User.find(
			{},
			'firstName lastName role approvalStatus'
		);
		res.json(users);
	} catch (err) {
		console.error('Error fetching users:', err);
		res.status(500).json({
			message: 'Server error: Unable to fetch users'
		});
	}
});

router.put('/users/:id/approve', auth, async (req, res) => {
	try {
		// Check if user has approval perms
		if (!hasPermission(req.permissions, 'approve_user', 'All'))
			return res.status(403).json({ message: httpMessages.err_invalid_perms});
		const { status } = req.body;

		if (!['Approved', 'Rejected'].includes(status))
			return res.status(400).json({ message: httpMessages.err_invalid_status });

		const user = await User.findById(
			req.params.id,
		);

		// Check if user to approve exists and if that user's role is less than or
		// equal to requesters role
		if (!user)
			return res.status(404).json({ message: httpMessages.err_user_not_exist });
		if (roleToNumberMap[user.role] > roleToNumberMap[req.decodedAuthToken.role])
			return res.status(403).json({ message: httpMessages.err_invalid_role});

		user.approvalStatus = status;
		user.save();
		res.json({ message: `User ${status}`, user: user });
	} catch (err) {
		console.error('Error updating approval status:', err);
		res.status(500).json({
			message: 'Server error: Unable to update approval status.'
		});
	}
});

// ─── For Admin to PreAuthorize  ─────────────────────────────────────
router.post('/preapprove', auth, async (req, res) => {
	try {
		// Check if user has approval perms and that new user isn't a role above
		// the creating user. Also check for missing fields.
		if (!hasPermission(req.permissions, 'approve_user', 'All'))
			return res.status(403).json({ message: httpMessages.err_invalid_perms});

		const { firstName, lastName, email, phone, role } = req.body;
		if (!phone || !firstName || !lastName || !email || !role)
			return res.status(400).json({ message: httpMessages.err_missing_fields });
		if (!role_values.includes(role))
			return res.status(400).json({ message: httpMessages.err_invalid_fields });
		if (roleToNumberMap[role] > roleToNumberMap[req.decodedAuthToken.role])
			return res.status(403).json({ message: httpMessages.err_invalid_role});
		if (await User.findOne({ phone }))
			return res.status(400).json({ message: httpMessages.err_user_exist_phone });

		// Gets default permissions for given role.
		const permissions = getDefaultPermissions(role);
		const newUser = new User({
			firstName,
			lastName,
			email,
			phone,
			role,
			permissions,
			approvalStatus: 'Approved'
		});
		await newUser.save();
		res.status(201).json({ message: httpMessages.success_preapprove });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: 'Server Error: Could not register user'
		});
	}
});

// ─── View Profile   ─────────────────────────────────────────────────
router.get('/users/:employeeId', auth, async (req, res) => {
	try {
		// Check if the user has view all profiles perms or if the 
		// user is viewing their own profile with view self profile perms.
		if ((req.decodedAuthToken.employeeId != req.params.employeeId || // Not viewing self
			!hasPermission(req.permissions, 'view_profile', 'Self')) &&  // Doesn't have self view perms
			!hasPermission(req.permissions, 'view_profile', 'All'))      // Doesn't have global view perms
			return res.status(403).json({ message: httpMessages.err_invalid_perms});

		const user = await User.findOne({ employeeId: req.params.employeeId });
		if (!user) {
			return res.status(404).json({ message: httpMessages.err_user_not_exist });
		}

		res.json(user);
	} catch (err) {
		console.error('Error fetching user profile:', err);
		res.status(500).json({
			message: 'Server error: Unable to fetch user profile'
		});
	}
});

// ─── Edit User Profile  ─────────────────────────────────────────────
router.put('/users/:employeeId', auth, async (req, res) => {
	try {
		// Check if the user has edit profile perms or if the user is
		// editing their own profile and has permission to edit their profile.
		if ((req.decodedAuthToken.employeeId != req.params.employeeId || // Not editing self
			!hasPermission(req.permissions, 'edit_profile', 'Self')) &&  // Doesn't have self edit perms
			!hasPermission(req.permissions, 'edit_profile', 'All'))      // Doesn't have global edit perms
			return res.status(403).json({ message: httpMessages.err_invalid_perms});

		const { firstName, lastName, email, phone, role } = req.body;
		if (role && !role_values.includes(role))
			return res.status(400).json({ message: httpMessages.err_invalid_fields});
		if (role && roleToNumberMap[role] > roleToNumberMap[req.decodedAuthToken.role])
			return res.status(403).json({ message: httpMessages.err_invalid_role});

		const updatedUser = await User.findOneAndUpdate(
			{ employeeId: req.params.employeeId },
			{ firstName, lastName, email, phone, role },
			{ new: true }
		);
		if (!updatedUser) {
			return res.status(404).json({ message: httpMessages.err_user_not_exist });
		}

		res.json({
			message: httpMessages.success_updated_user,
			user: updatedUser
		});
	} catch (err) {
		console.error('Error updating user profile:', err);
		res.status(500).json({
			message: 'Server error: Unable to update user profile'
		});
	}
});

// ─── View Profile by _id ────────────────────────────────────────────
router.get('/users/by-id/:id', auth, async (req, res) => {
	try {
		// Check if the user has view all profiles perms or if the 
		// user is viewing their own profile with view self profile perms.
		if ((req.requestorID != req.params.id || 					    // Not viewing self
			!hasPermission(req.permissions, 'view_profile', 'Self')) && // Doesn't have self view perms
			!hasPermission(req.permissions, 'view_profile', 'All'))     // Doesn't have global view perms
			return res.status(403).json({ message: httpMessages.err_invalid_perms});

		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({ message: httpMessages.err_user_not_exist });
		}

		res.json(user);
	} catch (err) {
		console.error('Error fetching user profile by _id:', err);
		res.status(500).json({
			message: 'Server error: Unable to fetch user profile'
		});
	}
});

// ─── Edit User Profile by _id ───────────────────────────────────────
router.put('/users/by-id/:id', auth, async (req, res) => {
	try {
		// Check if the user has edit profile perms or if the user is
		// editing their own profile and has permission to edit their profile.
		if ((req.requestorID != req.params.id || 					    // Not editing self
			!hasPermission(req.permissions, 'edit_profile', 'Self')) && // Doesn't have self edit perms
			!hasPermission(req.permissions, 'edit_profile', 'All'))     // Doesn't have global edit perms
			return res.status(403).json({ message: httpMessages.err_invalid_perms});

		const { firstName, lastName, email, phone, role, permissions } = req.body;
		if (role && !role_values.includes(role))
			return res.status(400).json({ message: httpMessages.err_invalid_fields});
		if (role && roleToNumberMap[role] > roleToNumberMap[req.decodedAuthToken.role])
			return res.status(403).json({ message: httpMessages.err_invalid_role});
		
		const user = await User.findById(req.params.id);
		if (!user) {
			return res.status(404).json({ message: httpMessages.err_user_not_exist });
		}

		if (permissions) {
			// There is no change_perms self permission, so don't check and don't
			// allow anyone to change their own perms.
			if (!hasPermission(req.permissions, 'change_perms', 'All') ||
				req.requestorID == req.params.id)
				return res.status(403).json({ message: httpMessages.err_invalid_perms});
			if (!validPermList(permissions))
				return res.status(400).json({ message: httpMessages.err_invalid_fields});
			user.perms = permissions;
			user.save();
		}

		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{ firstName, lastName, email, phone, role },
			{ new: true }
		);
		
		res.json({
			message: httpMessages.success_updated_user,
			user: updatedUser
		});
	} catch (err) {
		console.error('Error updating user profile by _id:', err);
		res.status(500).json({
			message: 'Server error: Unable to update user profile'
		});
	}
});
module.exports = router;
