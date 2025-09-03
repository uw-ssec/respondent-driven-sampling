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

/**
 * Determines if a given permission list has the required permission.
 * @param {Array<Permission>} permissionList 
 * @param {string} permissionType the type of permission to check for
 * @param {string} limiter the required limiter of the permission 
 * @returns {boolean} true/false for if the permission list had the permission
 */
function hasPermission(permissionList, permissionType, limiter) {
  let found = false;
  permissionList.forEach(perm => {
    if (perm.type == permissionType &&
       (perm.limiter == limiter || limiter == 'Self')) {
      found = true;
    }
  });
  return found;
}

module.exports = {
  generateEmployeeId,
  roleToNumberMap,
  hasPermission
}