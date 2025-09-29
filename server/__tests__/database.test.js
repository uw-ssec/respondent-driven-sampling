const mongoose = require('mongoose');
const connectDB = require('../database');

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn()
}));

// Mock console.log and console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let consoleOutput = [];

describe('Database Connection', () => {
  beforeAll(() => {
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
    console.error = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
  });

  afterAll(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    consoleOutput = [];
    jest.clearAllMocks();
  });

  test('should connect to MongoDB successfully', async () => {
    mongoose.connect.mockResolvedValueOnce();
    
    await connectDB();
    
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(
      expect.stringContaining('mongodb+srv://'),
      expect.objectContaining({
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    );
    expect(consoleOutput).toContain('MongoDB Connected...');
  });

  test('should handle connection error', async () => {
    const mockError = new Error('Connection failed');
    mongoose.connect.mockRejectedValueOnce(mockError);
    
    // Mock process.exit to prevent test from exiting
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    
    await connectDB();
    
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(consoleOutput.join(' ')).toContain('MongoDB connection failed:');
    expect(mockExit).toHaveBeenCalledWith(1);
    
    mockExit.mockRestore();
  });
}); 