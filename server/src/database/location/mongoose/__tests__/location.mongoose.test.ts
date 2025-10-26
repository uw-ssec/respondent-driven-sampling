import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test
} from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { HubType, LocationType } from '../../../utils/constants';
import Location from '../location.model';

describe('Location Model', () => {
	let mongoServer: MongoMemoryServer;

	beforeAll(async () => {
		// Connect once at the start
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
		await Location.ensureIndexes();
	});

	afterAll(async () => {
		// Disconnect once at the end
		await mongoose.connection.close();
		await mongoServer.stop();
	});

	beforeEach(async () => {
		// Clear the database before each test
		await Location.deleteMany({});
	});

	// Test schema validation
	test('valid location creation (basic)', async () => {
		const validLocation = {
			hubName: 'Test Hub',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: '123 Main St, City, State'
		};

		const location = new Location(validLocation);
		const savedLocation = await location.save();

		expect(savedLocation._id).toBeDefined();
		expect(savedLocation.hubName).toBe('Test Hub');
		expect(savedLocation.hubType).toBe(HubType.ESTABLISHMENT);
		expect(savedLocation.locationType).toBe(LocationType.ROOFTOP);
		expect(savedLocation.address).toBe('123 Main St, City, State');
	});

	test('invalid location - missing required fields', async () => {
		const invalidLocation = {
			// Missing all required fields
		};

		const location = new Location(invalidLocation);
		await expect(location.save()).rejects.toThrow();
	});

	test('invalid location - missing hubName', async () => {
		const invalidLocation = {
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: '123 Main St'
		};

		const location = new Location(invalidLocation);
		await expect(location.save()).rejects.toThrow();
	});

	test('invalid location - missing hubType', async () => {
		const invalidLocation = {
			hubName: 'Test Hub',
			locationType: LocationType.ROOFTOP,
			address: '123 Main St'
		};

		const location = new Location(invalidLocation);
		await expect(location.save()).rejects.toThrow();
	});

	test('invalid location - missing locationType', async () => {
		const invalidLocation = {
			hubName: 'Test Hub',
			hubType: HubType.ESTABLISHMENT,
			address: '123 Main St'
		};

		const location = new Location(invalidLocation);
		await expect(location.save()).rejects.toThrow();
	});

	test('invalid location - missing address', async () => {
		const invalidLocation = {
			hubName: 'Test Hub',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP
		};

		const location = new Location(invalidLocation);
		await expect(location.save()).rejects.toThrow();
	});

	test('invalid location - invalid hubType enum', async () => {
		const invalidLocation = {
			hubName: 'Test Hub',
			hubType: 'INVALID_HUB_TYPE',
			locationType: LocationType.ROOFTOP,
			address: '123 Main St'
		};

		const location = new Location(invalidLocation);
		await expect(location.save()).rejects.toThrow();
	});

	test('invalid location - invalid locationType enum', async () => {
		const invalidLocation = {
			hubName: 'Test Hub',
			hubType: HubType.ESTABLISHMENT,
			locationType: 'INVALID_LOCATION_TYPE',
			address: '123 Main St'
		};

		const location = new Location(invalidLocation);
		await expect(location.save()).rejects.toThrow();
	});

	// Test uniqueness constraints
	test('duplicate hubName should fail', async () => {
		const locationData = {
			hubName: 'Duplicate Hub',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: '123 Main St'
		};

		// Create first location
		const location1 = new Location(locationData);
		await location1.save();

		// Try to create second location with same hubName
		const location2 = new Location(locationData);
		await expect(location2.save()).rejects.toThrow();
	});

	test('duplicate address should fail', async () => {
		const locationData = {
			hubName: 'Test Hub',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: '123 Duplicate St'
		};

		// Create first location
		const location1 = new Location(locationData);
		await location1.save();

		// Try to create second location with same address
		const location2 = new Location({
			...locationData,
			hubName: 'Different Hub'
		});
		await expect(location2.save()).rejects.toThrow();
	});

	test('can create multiple locations with different hubName and address', async () => {
		const location1 = new Location({
			hubName: 'Hub One',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: '123 First St'
		});

		const location2 = new Location({
			hubName: 'Hub Two',
			hubType: HubType.CHURCH,
			locationType: LocationType.APPROXIMATE,
			address: '456 Second Ave'
		});

		const savedLocation1 = await location1.save();
		const savedLocation2 = await location2.save();

		expect(savedLocation1.hubName).toBe('Hub One');
		expect(savedLocation2.hubName).toBe('Hub Two');
		expect(savedLocation1.address).toBe('123 First St');
		expect(savedLocation2.address).toBe('456 Second Ave');
		expect(savedLocation1._id).not.toEqual(savedLocation2._id);
	});

	// Test edge cases
	test('empty string hubName should fail', async () => {
		const location = new Location({
			hubName: '',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: '123 Main St'
		});

		await expect(location.save()).rejects.toThrow();
	});

	test('empty string address should fail', async () => {
		const location = new Location({
			hubName: 'Test Hub',
			hubType: HubType.ESTABLISHMENT,
			locationType: LocationType.ROOFTOP,
			address: ''
		});

		await expect(location.save()).rejects.toThrow();
	});
});
