const mongoose = require('mongoose');
const User = require('../models/Users');

/**
 * Returns a unique employee ID
 * @returns a unique
 */
module.exports = async function generateEmployeeId() {
  return await getUniqueEmployeeId();
}

/**
 * Helper function that queries the database and returns a promise with a unique employee id
 * @returns a promise that contains a unique employee id
 */ 
async function getUniqueEmployeeId() {
  let empId = "EMP" + Math.floor(1000 + Math.random() * 9000);
  let userWithId = await User.findOne({employeeId: empId});
  while (userWithId) {
    empId = "EMP" + Math.floor(1000 + Math.random() * 9000);
    userWithId = await User.findOne({employeeId: empId});
  }
  return empId;
};

