const mongoose = require('mongoose');
const {User, permission_types, limiter_values } = require('../models/Users');



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

/**
 * Determines if a given permission list is valid. For a permission list to be
 * valid then it must be a list of objects each with a type field and limiter
 * field. The types must be a string that is in the list of possible permission
 * types and the limiters must be in the list of possible limiters. The list
 * must also have no duplicate permission types.
 * @param {Array<Permission>} permissionList List of permissions to determine
 *  if it is valid.
 * @returns {boolean} true/false for if the permissionList is valid.
 */
function validPermList(permissionList) {
  let valid = true;
  // Create copy of permission_types array so we can mutate it freely
  let permsTypes = Array.from(permission_types);
  permissionList.forEach(perm => {
    if (!perm.type || !perm.limiter ||
      !permsTypes.includes(perm.type) ||
      !limiter_values.includes(perm.limiter)) {
        valid = false;
      } else {
        // Remove the already seen permission type so if we see it again we will
        // mark the list as invalid (no duplicate types).
        const index = permsTypes.indexOf(perm.type);
        permsTypes[index] = undefined;
      }
  })
  return valid;
}

/**
 * Determines the deafult permissions for a given role. If role is invalid then returns an empty list.
 * @param {string} role The role to determine permissions for.
 * @returns {Array<Permission>} Array of permissions for given role, empty if invalid role.
 */
function getDefaultPermissions(role) {
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
    return permissions
}

module.exports = {
  generateEmployeeId,
  roleToNumberMap,
  hasPermission,
  validPermList,
  getDefaultPermissions
}