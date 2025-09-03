const mongoose = require('mongoose');
const User = require('../models/Users');



/**
 * Generates new employee ID that is not taken by any employee currently in
 * the database.
 * @returns a unique employee ID
 */
async function generateEmployeeId() {
  let empId = "EMP" + Math.floor(1000 + Math.random() * 9000);
  let userWithId = await User.findOne({employeeId: empId});
  while (userWithId) {
    empId = "EMP" + Math.floor(1000 + Math.random() * 9000);
    userWithId = await User.findOne({employeeId: empId});
  }
  return empId;
};

/**
 * maps user role to an integer number used to easily compare heirachy 
 * of roles. (So "Admin" -> 2, "Manager" -> 1, and "Volunteer" -> 0)
 */
const roleToNumberMap = {
  "Admin": 2,
  "Manager": 1,
  "Volunteer": 0
}

module.exports = {
  generateEmployeeId,
  roleToNumberMap
}