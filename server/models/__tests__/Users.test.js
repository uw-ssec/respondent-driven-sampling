const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../Users');

describe('User Model Test', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test('should create and save a user successfully', async () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '1234567890',
      role: 'Volunteer'
    };
    
    const validUser = new User(userData);
    const savedUser = await validUser.save();
    
    expect(savedUser._id).toBeDefined();
    expect(savedUser.employeeId).toMatch(/^EMP\d{4}$/);
    expect(savedUser.firstName).toBe(userData.firstName);
    expect(savedUser.lastName).toBe(userData.lastName);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.phone).toBe(userData.phone);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.approvalStatus).toBe('Pending'); // Default value
  });

  test('should fail validation for missing required fields', async () => {
    const userWithoutRequiredField = new User({ firstName: 'John' });
    
    let err;
    try {
      await userWithoutRequiredField.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });
  
  test('should generate unique employeeId', async () => {
    const userData1 = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      role: 'Volunteer'
    };
    
    const userData2 = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '9876543210',
      role: 'Manager'
    };
    
    const user1 = await new User(userData1).save();
    const user2 = await new User(userData2).save();
    
    expect(user1.employeeId).not.toBe(user2.employeeId);
    expect(user1.employeeId).toMatch(/^EMP\d{4}$/);
    expect(user2.employeeId).toMatch(/^EMP\d{4}$/);
  });
  
  test('should enforce unique email constraint', async () => {
    const userData1 = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'same.email@example.com',
      phone: '1234567890',
      role: 'Volunteer'
    };
    
    const userData2 = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'same.email@example.com',
      phone: '9876543210',
      role: 'Manager'
    };
    
    await new User(userData1).save();
    
    let err;
    try {
      await new User(userData2).save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.code).toBe(11000); // Duplicate key error
  });
  
  test('should validate role enum values', async () => {
    const userWithInvalidRole = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      role: 'InvalidRole'
    });
    
    let err;
    try {
      await userWithInvalidRole.save();
    } catch (error) {
      err = error;
    }
    
    expect(err).toBeDefined();
    expect(err.name).toBe('ValidationError');
  });
}); 