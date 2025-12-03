#!/usr/bin/env tsx

/**
 * Script to perform CRUD operations on Locations
 * Usage: npm run location -- <operation> [args]
 *
 * Operations:
 *   create <hubName> <hubType> <locationType> <address>
 *     Example: npm run location -- create "My Friends Place" ESTABLISHMENT ROOFTOP "5850 Hollywood Blvd, LA CA 90028"
 *
 *   list
 *     Example: npm run location -- list
 *
 *   get <objectId|hubName>
 *     Example: npm run location -- get 507f1f77bcf86cd799439011
 *     Example: npm run location -- get "My Friends Place"
 *
 *   update <objectId> [--hubName <name>] [--hubType <type>] [--locationType <type>] [--address <address>]
 *     Example: npm run location -- update 507f1f77bcf86cd799439011 --hubName "New Name" --address "New Address"
 *
 *   delete <objectId>
 *     Example: npm run location -- delete 507f1f77bcf86cd799439011
 *
 * Valid hubType values: ESTABLISHMENT, STREET_ADDRESS, PREMISE, CHURCH, LOCALITY
 * Valid locationType values: ROOFTOP, APPROXIMATE
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverRequire = createRequire(path.join(__dirname, '../server/package.json'));
const mongoose = serverRequire('mongoose');

// ===== Validation Helper Functions =====

function isValidObjectId(identifier: string): boolean {
	return mongoose.Types.ObjectId.isValid(identifier) && /^[0-9a-fA-F]{24}$/.test(identifier);
}

// ===== Lookup Helper Functions =====

async function findLocationByIdentifier(identifier: string, Location: any): Promise<any> {
	const isObjectId = isValidObjectId(identifier);

	let location;
	let idType: string;

	if (isObjectId) {
		console.log(`Looking up location with ObjectId: "${identifier}"...`);
		location = await Location.findById(identifier);
		idType = 'ObjectId';
	} else {
		console.log(`Looking up location with hubName: "${identifier}"...`);
		location = await Location.findOne({ hubName: identifier });
		idType = 'hub name';
	}

	if (!location) {
		throw new Error(`Location with ${idType} "${identifier}" not found`);
	}

	return location;
}

// ===== CREATE Operation =====

async function createLocation(
	hubName: string,
	hubType: string,
	locationType: string,
	address: string,
	Location: any,
	createLocationSchema: any,
): Promise<void> {
	console.log('\n📝 Creating new Location...\n');

	// Validate inputs using Zod schema
	const validationResult = createLocationSchema.safeParse({
		hubName,
		hubType,
		locationType,
		address,
	});

	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues
			? validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n')
			: validationResult.error.message || 'Unknown validation error';
		throw new Error(`Validation failed:\n\n${errorMessages}`);
	}

	const validatedData = validationResult.data;

	const location = await Location.create({
		hubName: validatedData.hubName,
		hubType: validatedData.hubType,
		locationType: validatedData.locationType,
		address: validatedData.address,
	});

	console.log('✓ Location created successfully!\n');
	console.log('Details:');
	console.log(`  ObjectId: ${location._id}`);
	console.log(`  Hub Name: ${location.hubName}`);
	console.log(`  Hub Type: ${location.hubType}`);
	console.log(`  Location Type: ${location.locationType}`);
	console.log(`  Address: ${location.address}`);
	console.log(`  Created: ${location.createdAt}`);
}

// ===== READ Operations =====

async function listLocations(Location: any): Promise<void> {
	console.log('\n📋 Listing all Locations...\n');

	const locations = await Location.find({}).sort({ hubName: 1 });

	if (locations.length === 0) {
		console.log('No locations found.');
		return;
	}

	console.log(`Found ${locations.length} location(s):\n`);

	for (const location of locations) {
		console.log(`${location.hubName}`);
		console.log(`  ObjectId: ${location._id}`);
		console.log(`  Hub Type: ${location.hubType}`);
		console.log(`  Location Type: ${location.locationType}`);
		console.log(`  Address: ${location.address}`);
		console.log(`  Created: ${location.createdAt}`);
		console.log('');
	}
}

async function getLocation(identifier: string, Location: any): Promise<void> {
	console.log('\n🔍 Fetching Location details...\n');

	const location = await findLocationByIdentifier(identifier, Location);

	console.log(`${location.hubName}`);
	console.log(`  ObjectId: ${location._id}`);
	console.log(`  Hub Type: ${location.hubType}`);
	console.log(`  Location Type: ${location.locationType}`);
	console.log(`  Address: ${location.address}`);
	console.log(`  Created: ${location.createdAt}`);
	console.log(`  Updated: ${location.updatedAt}`);
	console.log('');
}

// ===== UPDATE Operation =====

async function updateLocation(
	identifier: string,
	updates: {
		hubName?: string;
		hubType?: string;
		locationType?: string;
		address?: string;
	},
	Location: any,
	updateLocationSchema: any,
): Promise<void> {
	console.log('\n✏️  Updating Location...\n');

	const location = await findLocationByIdentifier(identifier, Location);

	// Validate updates using Zod schema
	const validationResult = updateLocationSchema.safeParse(updates);

	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues
			? validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')
			: validationResult.error.message || 'Unknown validation error';
		throw new Error(`Validation failed: ${errorMessages}`);
	}

	const validatedUpdates = validationResult.data;

	// Apply validated updates
	if (validatedUpdates.hubName !== undefined) {
		location.hubName = validatedUpdates.hubName;
	}

	if (validatedUpdates.hubType !== undefined) {
		location.hubType = validatedUpdates.hubType;
	}

	if (validatedUpdates.locationType !== undefined) {
		location.locationType = validatedUpdates.locationType;
	}

	if (validatedUpdates.address !== undefined) {
		location.address = validatedUpdates.address;
	}

	await location.save();

	console.log('✓ Location updated successfully!\n');
	console.log('Updated Details:');
	console.log(`  ObjectId: ${location._id}`);
	console.log(`  Hub Name: ${location.hubName}`);
	console.log(`  Hub Type: ${location.hubType}`);
	console.log(`  Location Type: ${location.locationType}`);
	console.log(`  Address: ${location.address}`);
	console.log(`  Updated: ${location.updatedAt}`);
}

// ===== DELETE Operation =====

async function deleteLocation(identifier: string, Location: any): Promise<void> {
	console.log('\n🗑️  Deleting Location...\n');

	const location = await findLocationByIdentifier(identifier, Location);

	await Location.findByIdAndDelete(location._id);

	console.log('✓ Location deleted!\n');
	console.log('Deleted Location:');
	console.log(`  ObjectId: ${location._id}`);
	console.log(`  Hub Name: ${location.hubName}`);
	console.log(`  Address: ${location.address}`);
}

// ===== Main Script Logic =====

async function main(): Promise<void> {
	const Location = (await import('../server/src/database/location/mongoose/location.model.js')).default;
	const connectDB = (await import('../server/src/database/index.js')).default;
	const { createLocationSchema, updateLocationSchema } = await import(
		'../server/src/database/location/zod/location.validator.js'
	);

	try {
		console.log('Connecting to database...');
		await connectDB();
		console.log('Connected to database ✓');

		const args = process.argv.slice(2);

		if (args.length === 0) {
			printUsage();
			process.exit(1);
		}

		const operation = args[0].toLowerCase();

		switch (operation) {
			case 'create':
				if (args.length < 5) {
					console.error('Error: create requires 4 arguments: <hubName> <hubType> <locationType> <address>');
					process.exit(1);
				}
				await createLocation(args[1], args[2], args[3], args[4], Location, createLocationSchema);
				break;

			case 'list':
				await listLocations(Location);
				break;

			case 'get':
				if (args.length < 2) {
					console.error('Error: get requires 1 argument: <objectId|hubName>');
					process.exit(1);
				}
				await getLocation(args[1], Location);
				break;

			case 'update': {
				if (args.length < 3) {
					console.error('Error: update requires at least objectId and one update flag');
					process.exit(1);
				}

				const identifier = args[1];
				const updates: any = {};

				for (let i = 2; i < args.length; i++) {
					const arg = args[i];
					if (arg.startsWith('--')) {
						const key = arg.slice(2);
						const value = args[i + 1];

						if (!value || value.startsWith('--')) {
							console.error(`Error: --${key} requires a value`);
							process.exit(1);
						}

						switch (key) {
							case 'hubName':
								updates.hubName = value;
								break;
							case 'hubType':
								updates.hubType = value;
								break;
							case 'locationType':
								updates.locationType = value;
								break;
							case 'address':
								updates.address = value;
								break;
							default:
								console.error(`Error: Unknown update flag --${key}`);
								process.exit(1);
						}

						i++; // Skip the value in next iteration
					}
				}

				if (Object.keys(updates).length === 0) {
					console.error('Error: No valid update flags provided');
					process.exit(1);
				}

				await updateLocation(identifier, updates, Location, updateLocationSchema);
				break;
			}

			case 'delete':
				if (args.length < 2) {
					console.error('Error: delete requires 1 argument: <objectId|hubName>');
					process.exit(1);
				}
				await deleteLocation(args[1], Location);
				break;

			default:
				console.error(`Error: Unknown operation "${operation}"`);
				printUsage();
				process.exit(1);
		}
	} catch (error) {
		console.error('\n✗ Error:', error instanceof Error ? error.message : error);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
		console.log('\nDatabase connection closed.');
		process.exit(0);
	}
}

function printUsage(): void {
	console.log(`
Usage: npm run location -- <operation> [args]

Operations:

  create <hubName> <hubType> <locationType> <address>
    Create a new location
    Example: npm run location -- create "My Friends Place" ESTABLISHMENT ROOFTOP "5850 Hollywood Blvd, LA CA 90028"

  list
    List all locations
    Example: npm run location -- list

  get <objectId|hubName>
    Get details of a specific location
    Example: npm run location -- get 507f1f77bcf86cd799439011
    Example: npm run location -- get "My Friends Place"

  update <objectId> [options]
    Update location details. Available options:
      --hubName <name>          Update hub name
      --hubType <type>          Update hub type
      --locationType <type>     Update location type
      --address <address>       Update address
    Example: npm run location -- update 507f1f77bcf86cd799439011 --hubName "New Name" --address "New Address"

  delete <objectId>
    Delete a location
    Example: npm run location -- delete 507f1f77bcf86cd799439011

Valid hubType values:
  - ESTABLISHMENT
  - STREET_ADDRESS
  - PREMISE
  - CHURCH
  - LOCALITY

Valid locationType values:
  - ROOFTOP (precise coordinates)
  - APPROXIMATE (approximate location)
	`);
}

// Run the script
main();
