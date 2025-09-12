const mongoose = require('mongoose');

// User schema definition
// This schema defines the structure of the user data in the MongoDB database.
// It includes fields for employee ID, first name, last name, email, phone number,
const userSchema = new mongoose.Schema({
  employeeId: { // Employee id of user
    type: String,
    unique: true,
    default: function () {
      return `EMP${Math.floor(1000 + Math.random() * 9000)}`;
    }
  },
  firstName:  { type: String, required: true }, // first name of user
  lastName:   { type: String, required: true }, // last name of user
  email:      { type: String, required: true, unique: true }, // Email of user
  phone:      { type: String, required: true }, // Phone number of user
  role: {
    type: String,
    enum: ['Volunteer', 'Manager', 'Admin'],
    required: true
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;