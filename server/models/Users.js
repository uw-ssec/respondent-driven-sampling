const mongoose = require('mongoose');

// Schema type for permissions of users.
// Includes a limiter which defines how broadly the permission can be used.
// Some combinations of limiters and perm type will not be used,
// for example change_perm type with location limiter.
const permissionSchema = new mongoose.Schema({
  type: { 
    type: String,
    enum: ['view_survey', 'delete_survey', 'change_perms', 'edit_profile', 'approve_user'],
    required: true 
  },
  limiter: { 
    type: String,
    enum: ['Self', 'Location', 'All'],
    required: true
  }
});

// User schema definition
// This schema defines the structure of the user data in the MongoDB database.
// It includes a role along with a list of permissions each user has.
const userSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    unique: true,
    default: function () {
      return `EMP${Math.floor(1000 + Math.random() * 9000)}`;
    }
  },
  firstName:  { type: String, required: true },
  lastName:   { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  phone:      { type: String, required: true },
  location:   { type: String, required: true },
  role: {
    type: String,
    enum: ['Volunteer', 'Manager', 'Admin'],
    required: true
  },
  // List of permissions the user has, each permission must be unique by type.
  // This means there cannot be two 'view_survey' permission types for one user.
  // However this is not enforced by the schema by just by convention. We could
  // add a custom validator to enforce this if needed.
  permissions: {
    type: [permissionSchema],
    alias: 'perms'
  },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;