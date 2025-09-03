const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const { generateAuthToken } = require('../utils/authTokenHandler');
const { auth } = require('../middleware/auth');
const {generateEmployeeId, roleToNumberMap} = require('../utils/userUtils');
const httpMessages = require('../messages');

const twilio = require('twilio');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

const client = twilio(accountSid, authToken);
const verifyService = client.verify.v2.services(verifySid);

// ─── Send OTP for SIGNUP ─────────────────────────────────────────────
router.post('/send-otp-signup', async (req, res) => {
	const { phone, email } = req.body;
	try {
		const existingUser = await User.findOne({
			$or: [{ phone }, { email }]
		});
		if (existingUser) {
			return res
				.status(400)
				.json({ message: 'User already exists – please log in.' });
		}
		await verifyService.verifications.create({ to: phone, channel: 'sms' });
		res.json({ message: 'OTP sent!' });
	} catch (err) {
		console.error('Send OTP signup error:', err);
		res.status(500).json({ message: 'Failed to send OTP' });
	}
});

// ─── Send OTP for LOGIN ──────────────────────────────────────────────
router.post('/send-otp-login', async (req, res) => {
	const { email, phone } = req.body;
	try {
		const user = await User.findOne({ email, phone });
		if (!user) {
			return res.status(400).json({
				message: 'Email and phone number do not match any user.'
			});
		}
		await verifyService.verifications.create({ to: phone, channel: 'sms' });
		res.json({ message: 'OTP sent!' });
	} catch (err) {
		console.error('Send OTP login error:', err);
		res.status(500).json({ message: 'Failed to send OTP' });
	}
});

// ─── Verify OTP for SIGNUP ──────────────────────────────────────────
router.post('/verify-otp-signup', async (req, res) => {
	const { phone, code, firstName, lastName, email, role } = req.body;
	try {
		const check = await verifyService.verificationChecks.create({
			to: phone,
			code
		});
		if (check.status !== 'approved') {
			return res.status(400).json({ message: 'Invalid OTP' });
		}
		if (await User.findOne({ phone })) {
			return res
				.status(400)
				.json({ message: 'User already exists – please log in.' });
		}
    // Defining default permissions for role requested.
    let permissions = []
    switch (role) {
      case 'Volunteer':
        permissions = [{type: 'view_survey', limiter: 'Self'}, {type: 'delete_survey', limiter: 'Self'}, {type: 'view_profile', limiter: 'Self'}, {type: 'edit_profile', limiter: 'Self'}]
        break;
      case 'Manager':
        permissions = [{type: 'view_survey', limiter: 'All'}, {type: 'delete_survey', limiter: 'Self'}, {type: 'change_perms', limiter: 'All'}, {type: 'view_profile', limiter: 'All'}, {type: 'edit_profile', limiter: 'Self'}, {type: 'approve_user', limiter: 'All'}];
        break;
      case 'Admin':
        permissions = [{type: 'view_survey', limiter: 'All'}, {type: 'delete_survey', limiter: 'All'}, {type: 'change_perms', limiter: 'All'}, {type: 'view_profile', limiter: 'All'}, {type: 'edit_profile', limiter: 'All'}, {type: 'approve_user', limiter: 'All'}];
        break;
    }
		const employeeId = await generateEmployeeId();
		const newUser = new User({ employeeId, firstName, lastName, email, phone, role, permissions });
		await newUser.save();
		const token = generateAuthToken(
			newUser.firstName,
			newUser.role,
			newUser.employeeId
		);

		res.json({
			message: 'Signup successful!',
			token: token,
			redirectTo: '/dashboard'
		});
	} catch (err) {
		console.error('Verify OTP signup error:', err);
		res.status(500).json({ message: 'Failed to verify OTP during signup' });
	}
});

// ─── Verify OTP for LOGIN ────────────────────────────────────────────
router.post('/verify-otp-login', async (req, res) => {
	const { phone, code } = req.body;
	try {
		const check = await verifyService.verificationChecks.create({
			to: phone,
			code
		});
		if (check.status !== 'approved') {
			return res.status(400).json({ message: 'Invalid OTP' });
		}
		const user = await User.findOne({ phone });
		if (!user) {
			return res.status(400).json({
				message: 'No account for this phone – please sign up.'
			});
		}
		if (user.approvalStatus !== 'Approved') {
			return res.status(403).json({
				message: 'Account not approved yet. Please contact your admin.'
			});
		}
		const token = generateAuthToken(
			user.firstName,
			user.role,
			user.employeeId
		);

		res.json({
			message: 'Login successful!',
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
		if (!req.permissions.includes({type:'view_profile', limiter:'All'})) {
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
		if (!req.permissions.includes({type:'approve_user', limiter:'All'}))
			return res.status(403).json({ message: httpMessages.err_invalid_perms});
		const { status } = req.body;

		if (!['Approved', 'Rejected'].includes(status))
			return res.status(400).json({ message: 'Invalid status update.' });

		const user = await User.findById(
			req.params.id,
		);

		// Check if user to approve exists and if that user's role is less than or
		// equal to requesters role
		if (!user)
			return res.status(404).json({ message: 'User not found.' });
		if (roleToNumberMap(user.role) > roleToNumberMap(req.decodedAuthToken.role))
			return res.status(403).json({ message: httpMessages.err_invalid_perms});

		user.approvalStatus = status;
		res.json({ message: `User ${status}`, user: updatedUser });
	} catch (err) {
		console.error('Error updating approval status:', err);
		res.status(500).json({
			message: 'Server error: Unable to update approval status.'
		});
	}
});

// ─── For Admin to PreAuthorize  ───────────────────────────────────────
router.post('/preapprove', auth, async (req, res) => {
	if (req.decodedAuthToken.role != 'Admin') {
		return res.sendStatus(403);
	}
	try {
		const { firstName, lastName, email, phone, role } = req.body;
		if (await User.findOne({ phone })) {
			return res
				.status(400)
				.json({ message: 'User already exists with this phone' });
		}
		const newUser = new User({
			firstName,
			lastName,
			email,
			phone,
			role,
			approvalStatus: 'Approved'
		});
		await newUser.save();
		res.status(201).json({ message: 'User registered successfully!' });
	} catch (error) {
		console.error(error);
		res.status(500).json({
			message: 'Server Error: Could not register user'
		});
	}
});

// ─── View Profile   ───────────────────────────────────────
router.get('/users/:employeeId', auth, async (req, res) => {
	if (
		!['Admin', 'Manager'].includes(req.decodedAuthToken.role) &&
		req.decodedAuthToken.employeeId != req.params.employeeId
	) {
		return res.sendStatus(403);
	}
	try {
		const user = await User.findOne({ employeeId: req.params.employeeId });
		console.log('User found:', user);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		res.json(user);
	} catch (err) {
		console.error('Error fetching user profile:', err);
		res.status(500).json({
			message: 'Server error: Unable to fetch user profile'
		});
	}
});

// ─── Edit User Profile  ───────────────────────────────────────
router.put('/users/:employeeId', auth, async (req, res) => {
	if (
		req.decodedAuthToken.role != 'Admin' &&
		req.decodedAuthToken.employeeId != req.params.employeeId
	) {
		return res.sendStatus(403);
	}
	try {
		const { firstName, lastName, email, phone, role } = req.body;

		const updatedUser = await User.findOneAndUpdate(
			{ employeeId: req.params.employeeId },
			{ firstName, lastName, email, phone, role },
			{ new: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ message: 'User not found' });
		}

		res.json({
			message: 'Profile updated successfully',
			user: updatedUser
		});
	} catch (err) {
		console.error('Error updating user profile:', err);
		res.status(500).json({
			message: 'Server error: Unable to update user profile'
		});
	}
});

// ─── View Profile by _id ───────────────────────────────────────
router.get('/users/by-id/:id', auth, async (req, res) => {
	if (req.decodedAuthToken.role != 'Admin') {
		return res.sendStatus(403);
	}
	try {
		const user = await User.findById(req.params.id);
		console.log('User found:', user);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
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
	if (req.decodedAuthToken.role != 'Admin') {
		return res.sendStatus(403);
	}
	try {
		const { firstName, lastName, email, phone, role } = req.body;

		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{ firstName, lastName, email, phone, role },
			{ new: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ message: 'User not found' });
		}

		res.json({
			message: 'Profile updated successfully',
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
