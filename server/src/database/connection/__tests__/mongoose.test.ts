import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDB } from '../../index';

// Mock mongoose
jest.mock('mongoose');
const mockedMongoose = mongoose as jest.Mocked<typeof mongoose>;

// Mock console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
	throw new Error('process.exit called');
});

describe('Database Connection', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		process.env.MONGO_URI = 'mongodb+srv://test:test@test.mongodb.net/test?retryWrites=false&ssl=true';
	});

	afterEach(() => {
		consoleLogSpy.mockClear();
		consoleErrorSpy.mockClear();
		processExitSpy.mockClear();
	});

	it('should connect to MongoDB successfully', async () => {
		mockedMongoose.connect.mockResolvedValueOnce(mongoose);

		await connectDB();

		expect(mockedMongoose.connect).toHaveBeenCalledTimes(1);
		expect(mockedMongoose.connect).toHaveBeenCalledWith(
			process.env.MONGO_URI,
			{
				retryWrites: false,
				ssl: true
			}
		);
		expect(consoleLogSpy).toHaveBeenCalledWith('Connected to Azure Cosmos DB (MongoDB API)');
	});

	it('should handle connection failure and exit process', async () => {
		const mockError = new Error('Connection failed');
		mockedMongoose.connect.mockRejectedValueOnce(mockError);

		await expect(connectDB()).rejects.toThrow('process.exit called');

		expect(mockedMongoose.connect).toHaveBeenCalledTimes(1);
		expect(consoleErrorSpy).toHaveBeenCalledWith('MongoDB connection failed:', mockError);
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it('should use environment variable for connection string', async () => {
		const testUri = 'mongodb+srv://custom:uri@test.mongodb.net/custom?retryWrites=false&ssl=true';
		process.env.MONGO_URI = testUri;
		mockedMongoose.connect.mockResolvedValueOnce(mongoose);

		await connectDB();

		expect(mockedMongoose.connect).toHaveBeenCalledWith(testUri, {
			retryWrites: false,
			ssl: true
		});
	});
});