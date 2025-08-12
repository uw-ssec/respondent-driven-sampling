const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const {authenticateToken, createToken} = require('../utils/tokenHandling')
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });

const accountSid  = process.env.TWILIO_ACCOUNT_SID;
const authToken   = process.env.TWILIO_AUTH_TOKEN;
const verifySid   = process.env.TWILIO_VERIFY_SID;
const tokenSecret = process.env.TOKEN_SECRET;

const client = twilio(accountSid, authToken);
const verifyService = client.verify.v2.services(verifySid);

// ─── Send OTP for SIGNUP ─────────────────────────────────────────────
router.post('/send-otp-signup', async (req, res) => {
  const { phone, email } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists – please log in.' });
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
      return res.status(400).json({ message: 'Email and phone number do not match any user.' });
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
    const check = await verifyService.verificationChecks.create({ to: phone, code });
    if (check.status !== 'approved') {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (await User.findOne({ phone })) {
      return res.status(400).json({ message: 'User already exists – please log in.' });
    }
    const newUser = new User({ firstName, lastName, email, phone, role });
    await newUser.save();
    const token = createToken(newUser.firstName, newUser.role, newUser.employeeId)

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
    const check = await verifyService.verificationChecks.create({ to: phone, code });
    if (check.status !== 'approved') {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'No account for this phone – please sign up.' });
    }
    if (user.approvalStatus !== 'Approved') {
      return res.status(403).json({ message: 'Account not approved yet. Please contact your admin.' });
    }
    const token = createToken(user.firstName, user.role, user.employeeId)

    res.json({
      message: 'Login successful!',
      token: token,
      redirectTo: '/dashboard'
    });
  } catch (err) {
    console.error('Verify OTP login error:', err);
    res.status(500).json({ message: 'Failed to verify OTP during login' });
  }
});

// ─── Admin Approvals ────────────────────────────────────────────────
router.get('/users', authenticateToken, async (req, res) => {
  if (req.decodedToken.role != 'Admin') {
    return res.sendStatus(403)
  }
  try {
    const users = await User.find({}, 'firstName lastName role approvalStatus');
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error: Unable to fetch users" });
  }
});

router.put('/users/:id/approve', authenticateToken, async (req, res) => {
  if (req.decodedToken.role != 'Admin') {
    return res.sendStatus(403)
  }
  try {
    const { status } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update." });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: status },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json({ message: `User ${status}`, user: updatedUser });
  } catch (err) {
    console.error("Error updating approval status:", err);
    res.status(500).json({ message: "Server error: Unable to update approval status." });
  }
});


// ─── For Admin to PreAuthorize  ───────────────────────────────────────
router.post('/preapprove', authenticateToken, async (req, res) => {
  if (req.decodedToken.role != 'Admin') {
    return res.sendStatus(403)
  }
  try {
    const { firstName, lastName, email,phone, role} = req.body;
    if (await User.findOne({ phone })) {
      return res.status(400).json({ message: "User already exists with this phone" });
    }
    const newUser = new User({ firstName, lastName, email, phone, role, approvalStatus: "Approved" });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error: Could not register user" });
  }
});


// ─── View Profile   ───────────────────────────────────────
router.get('/users/:employeeId', authenticateToken, async (req, res) => {
  if ( !['Admin', 'Manager'].includes(req.decodedToken.role) && req.decodedToken.employeeId != req.params.employeeId) {
    return res.sendStatus(403)
  }
  try {
    const user = await User.findOne({ employeeId: req.params.employeeId });
    console.log("User found:", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: "Server error: Unable to fetch user profile" });
  }
});

// ─── Edit User Profile  ───────────────────────────────────────
router.put('/users/:employeeId', authenticateToken, async (req, res) => {
  if ( req.decodedToken.role != 'Admin' && req.decodedToken.employeeId != req.params.employeeId) {
    return res.sendStatus(403)
  }
  try {
    const { firstName, lastName, email, phone, role } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { employeeId: req.params.employeeId },
      { firstName, lastName, email, phone, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).json({ message: "Server error: Unable to update user profile" });
  }
});

// ─── View Profile by _id ───────────────────────────────────────
router.get('/users/by-id/:id', authenticateToken, async (req, res) => {
  if (req.decodedToken.role != 'Admin') {
    return res.sendStatus(403)
  }
  try {
    const user = await User.findById(req.params.id);
    console.log("User found:", user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile by _id:", err);
    res.status(500).json({ message: "Server error: Unable to fetch user profile" });
  }
});

// ─── Edit User Profile by _id ───────────────────────────────────────
router.put('/users/by-id/:id', authenticateToken, async (req, res) => {
  if (req.decodedToken.role != 'Admin') {
    return res.sendStatus(403)
  }
  try {
    const { firstName, lastName, email, phone, role } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, phone, role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error updating user profile by _id:", err);
    res.status(500).json({ message: "Server error: Unable to update user profile" });
  }
});


module.exports = router;
