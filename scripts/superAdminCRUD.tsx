#!/usr/bin/env tsx

/**
 * Script to perform CRUD operations on Super Admin users
 * Usage: npm run super-admin -- <operation> [args]
 *
 * Operations:
 *   create <firstName> <lastName> <email> <phone> <locationId>
 *     Example: npm run super-admin -- create John Doe john@example.com +15551234567 507f1f77bcf86cd799439011
 *
 *   list [--all]
 *     Example: npm run super-admin -- list
 *     Example: npm run super-admin -- list --all  (includes soft-deleted)
 *
 *   get <email|phone|objectId>
 *     Example: npm run super-admin -- get john@example.com
 *     Example: npm run super-admin -- get 5551234567
 *     Example: npm run super-admin -- get +15551234567
 *     Example: npm run super-admin -- get 507f1f77bcf86cd799439011
 *
 *   update <email|phone|objectId> [--firstName <name>] [--lastName <name>] [--email <email>] [--phone <phone>] [--location <locationId>] [--status <PENDING|APPROVED|REJECTED>]
 *     Example: npm run super-admin -- update john@example.com --firstName Jane --email jane@example.com
 *     Example: npm run super-admin -- update 5551234567 --email newemail@example.com
 *
 *   delete <email|phone|objectId> [--hard]
 *     Example: npm run super-admin -- delete john@example.com (soft delete)
 *     Example: npm run super-admin -- delete 5551234567 --hard (permanent delete)
 *
 *   restore <email|phone|objectId>
 *     Example: npm run super-admin -- restore john@example.com
 *     Example: npm run super-admin -- restore 5551234567
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
//import mongoose from 'mongoose';

// ===== Validation Helper Functions =====

function isValidObjectId(identifier: string): boolean {
	return mongoose.Types.ObjectId.isValid(identifier) && /^[0-9a-fA-F]{24}$/.test(identifier);
}

function isValidEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
	// Accept both formats: +15551234567 or 5551234567
	return /^\+1\d{10}$/.test(phone) || /^\d{10}$/.test(phone);
}

function normalizePhone(phone: string): string {
	// Normalize phone to +1XXXXXXXXXX format
	if (phone.startsWith('+1')) {
		return phone;
	}
	// If it's just 10 digits, add +1 prefix
	if (/^\d{10}$/.test(phone)) {
		return `+1${phone}`;
	}
	return phone;
}

// ===== Lookup Helper Functions =====

async function findUserByIdentifier(identifier: string, User: any): Promise<any> {
	const isObjectId = isValidObjectId(identifier);
	const isEmail = isValidEmail(identifier);
	const isPhone = isValidPhone(identifier);

	let user;
	let idType: string;

	if (isObjectId) {
		console.log(`Looking up user with ObjectId: "${identifier}"...`);
		user = await User.findById(identifier).select('+deletedAt');
		idType = 'ObjectId';
	} else if (isEmail) {
		console.log(`Looking up user with email: "${identifier}"...`);
		user = await User.findOne({ email: identifier }).select('+deletedAt');
		idType = 'email';
	} else if (isPhone) {
		const normalizedPhone = normalizePhone(identifier);
		console.log(`Looking up user with phone: "${normalizedPhone}"...`);
		user = await User.findOne({ phone: normalizedPhone }).select('+deletedAt');
		idType = 'phone number';
	} else {
		throw new Error(
			`Invalid identifier "${identifier}". Must be a valid ObjectId, email address, or phone number (+1XXXXXXXXXX or XXXXXXXXXX).`,
		);
	}

	if (!user) {
		throw new Error(`User with ${idType} "${identifier}" not found`);
	}

	return user;
}

async function validateLocationExists(locationId: string, Location: any): Promise<any> {
	const location = await Location.findById(locationId);
	if (!location) {
		throw new Error(`Location with ObjectId "${locationId}" not found`);
	}

	return location;
}

// ===== CREATE Operation =====

async function createSuperAdmin(
	firstName: string,
	lastName: string,
	email: string,
	phone: string,
	locationId: string,
	User: any,
	Location: any,
	createUserSchema: any,
): Promise<void> {
	console.log('\n📝 Creating new Super Admin...\n');

	// Normalize phone number before validation
	const normalizedPhone = normalizePhone(phone);

	// Validate inputs using Zod schema
	const validationResult = createUserSchema.safeParse({
		firstName,
		lastName,
		email,
		phone: normalizedPhone,
		role: 'SUPER_ADMIN',
		locationObjectId: locationId,
	});

	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues
			? validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n')
			: validationResult.error.message || 'Unknown validation error';
		throw new Error(`Validation failed:\n\n${errorMessages}`);
	}

	const validatedData = validationResult.data;
	const location = await validateLocationExists(locationId, Location);

	// Create super admin with PENDING status first (to satisfy the approverValidationHook)
	// The hook only allows null approvedByUserObjectId for PENDING users
	const superAdmin = await User.create({
		firstName: validatedData.firstName,
		lastName: validatedData.lastName,
		email: validatedData.email,
		phone: validatedData.phone,
		role: 'SUPER_ADMIN',
		approvalStatus: 'PENDING',
		locationObjectId: new mongoose.Types.ObjectId(locationId),
		permissions: [], // Super admins have full access via role
	});

	// Immediately approve the super admin (self-approval to avoid approval validation hook)
	superAdmin.approvalStatus = 'APPROVED';
	superAdmin.approvedByUserObjectId = superAdmin._id;
	await superAdmin.save();

	console.log('✓ Super Admin created successfully!\n');
	console.log('Details:');
	console.log(`  ObjectId: ${superAdmin._id}`);
	console.log(`  Name: ${superAdmin.firstName} ${superAdmin.lastName}`);
	console.log(`  Email: ${superAdmin.email}`);
	console.log(`  Phone: ${superAdmin.phone}`);
	console.log(`  Role: ${superAdmin.role}`);
	console.log(`  Status: ${superAdmin.approvalStatus}`);
	console.log(`  Location: ${location.hubName} (${location._id})`);
	console.log(`  Created: ${superAdmin.createdAt}`);
}

// ===== READ Operations =====

async function listSuperAdmins(User: any, Location: any, includeDeleted: boolean = false): Promise<void> {
	console.log(`\n📋 Listing all Super Admins${includeDeleted ? ' (including deleted)' : ''}...\n`);

	const query = User.find({ role: 'SUPER_ADMIN' });
	if (includeDeleted) {
		query.select('+deletedAt');
	} else {
		query.where('deletedAt').equals(null);
	}

	const superAdmins = await query.populate('locationObjectId').sort({ createdAt: -1 });

	if (superAdmins.length === 0) {
		console.log('No super admins found.');
		return;
	}

	console.log(`Found ${superAdmins.length} super admin(s):\n`);

	for (const admin of superAdmins) {
		const deletedStatus = admin.deletedAt ? ' [DELETED]' : '';
		console.log(`${admin.firstName} ${admin.lastName}${deletedStatus}`);
		console.log(`  ObjectId: ${admin._id}`);
		console.log(`  Email: ${admin.email}`);
		console.log(`  Phone: ${admin.phone}`);
		console.log(`  Status: ${admin.approvalStatus}`);
		console.log(
			`  Location: ${admin.locationObjectId?.hubName || 'N/A'} (${admin.locationObjectId?._id || 'N/A'})`,
		);
		console.log(`  Created: ${admin.createdAt}`);
		console.log(`  Updated: ${admin.updatedAt}`);
		if (admin.deletedAt) {
			console.log(`  Deleted: ${admin.deletedAt}`);
		}
		console.log('');
	}
}

async function getSuperAdmin(identifier: string, User: any, Location: any): Promise<void> {
	console.log('\n🔍 Fetching Super Admin details...\n');

	const user = await findUserByIdentifier(identifier, User);

	if (user.role !== 'SUPER_ADMIN') {
		throw new Error(`User "${identifier}" exists but is not a Super Admin (role: ${user.role})`);
	}

	// Populate location
	await user.populate('locationObjectId');

	const deletedStatus = user.deletedAt ? ' [DELETED]' : '';
	console.log(`${user.firstName} ${user.lastName}${deletedStatus}`);
	console.log(`  ObjectId: ${user._id}`);
	console.log(`  Email: ${user.email}`);
	console.log(`  Phone: ${user.phone}`);
	console.log(`  Role: ${user.role}`);
	console.log(`  Status: ${user.approvalStatus}`);
	console.log(`  Location: ${user.locationObjectId?.hubName || 'N/A'} (${user.locationObjectId?._id || 'N/A'})`);
	console.log(`  Created: ${user.createdAt}`);
	console.log(`  Updated: ${user.updatedAt}`);
	if (user.approvedByUserObjectId) {
		console.log(`  Approved By: ${user.approvedByUserObjectId}`);
	}
	if (user.deletedAt) {
		console.log(`  Deleted: ${user.deletedAt}`);
	}
	console.log('');
}

// ===== UPDATE Operation =====

async function updateSuperAdmin(
	identifier: string,
	updates: {
		firstName?: string;
		lastName?: string;
		email?: string;
		phone?: string;
		locationObjectId?: string;
		approvalStatus?: string;
	},
	User: any,
	Location: any,
	updateUserSchema: any,
): Promise<void> {
	console.log('\n✏️  Updating Super Admin...\n');

	const user = await findUserByIdentifier(identifier, User);

	if (user.role !== 'SUPER_ADMIN') {
		throw new Error(`User "${identifier}" exists but is not a Super Admin (role: ${user.role})`);
	}

	if (user.deletedAt) {
		throw new Error(`Cannot update deleted user. Restore the user first with the 'restore' command.`);
	}

	// Validate updates using Zod schema
	const validationResult = updateUserSchema.safeParse(updates);

	if (!validationResult.success) {
		// Format Zod errors for display
		const errorMessages = validationResult.error.issues
			? validationResult.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')
			: validationResult.error.message || 'Unknown validation error';
		throw new Error(`Validation failed: ${errorMessages}`);
	}

	const validatedUpdates = validationResult.data;

	// Apply validated updates (Mongoose will enforce unique constraints for email and phone)
	if (validatedUpdates.firstName !== undefined) {
		user.firstName = validatedUpdates.firstName;
	}

	if (validatedUpdates.lastName !== undefined) {
		user.lastName = validatedUpdates.lastName;
	}

	if (validatedUpdates.email !== undefined) {
		user.email = validatedUpdates.email;
	}

	if (validatedUpdates.phone !== undefined) {
		user.phone = validatedUpdates.phone;
	}

	if (validatedUpdates.locationObjectId !== undefined) {
		await validateLocationExists(validatedUpdates.locationObjectId, Location);
		user.locationObjectId = new mongoose.Types.ObjectId(validatedUpdates.locationObjectId);
	}

	if (validatedUpdates.approvalStatus !== undefined) {
		user.approvalStatus = validatedUpdates.approvalStatus;
	}

	await user.save();
	await user.populate('locationObjectId');

	console.log('✓ Super Admin updated successfully!\n');
	console.log('Updated Details:');
	console.log(`  ObjectId: ${user._id}`);
	console.log(`  Name: ${user.firstName} ${user.lastName}`);
	console.log(`  Email: ${user.email}`);
	console.log(`  Phone: ${user.phone}`);
	console.log(`  Status: ${user.approvalStatus}`);
	console.log(`  Location: ${user.locationObjectId?.hubName || 'N/A'} (${user.locationObjectId?._id || 'N/A'})`);
	console.log(`  Updated: ${user.updatedAt}`);
}

// ===== DELETE Operation =====

async function deleteSuperAdmin(identifier: string, hardDelete: boolean, User: any): Promise<void> {
	console.log(`\n🗑️  ${hardDelete ? 'Permanently deleting' : 'Soft deleting'} Super Admin...\n`);

	const user = await findUserByIdentifier(identifier, User);

	if (user.role !== 'SUPER_ADMIN') {
		throw new Error(`User "${identifier}" exists but is not a Super Admin (role: ${user.role})`);
	}

	if (hardDelete) {
		// Permanent deletion
		await User.findByIdAndDelete(user._id);
		console.log('✓ Super Admin permanently deleted!\n');
		console.log('Deleted User:');
		console.log(`  ObjectId: ${user._id}`);
		console.log(`  Name: ${user.firstName} ${user.lastName}`);
		console.log(`  Email: ${user.email}`);
	} else {
		// Soft deletion
		if (user.deletedAt) {
			console.log('⚠️  User is already soft deleted.');
			console.log(`   Deleted at: ${user.deletedAt}`);
			return;
		}

		user.deletedAt = new Date();
		await user.save();

		console.log('✓ Super Admin soft deleted (can be restored)!\n');
		console.log('Deleted User:');
		console.log(`  ObjectId: ${user._id}`);
		console.log(`  Name: ${user.firstName} ${user.lastName}`);
		console.log(`  Email: ${user.email}`);
		console.log(`  Deleted: ${user.deletedAt}`);
	}
}

// ===== RESTORE Operation =====

async function restoreSuperAdmin(identifier: string, User: any): Promise<void> {
	console.log('\n♻️  Restoring Super Admin...\n');

	const user = await findUserByIdentifier(identifier, User);

	if (user.role !== 'SUPER_ADMIN') {
		throw new Error(`User "${identifier}" exists but is not a Super Admin (role: ${user.role})`);
	}

	if (!user.deletedAt) {
		console.log('⚠️  User is not deleted. No action needed.');
		return;
	}

	user.deletedAt = null;
	await user.save();
	await user.populate('locationObjectId');

	console.log('✓ Super Admin restored successfully!\n');
	console.log('Restored User:');
	console.log(`  ObjectId: ${user._id}`);
	console.log(`  Name: ${user.firstName} ${user.lastName}`);
	console.log(`  Email: ${user.email}`);
	console.log(`  Phone: ${user.phone}`);
	console.log(`  Location: ${user.locationObjectId?.hubName || 'N/A'} (${user.locationObjectId?._id || 'N/A'})`);
}

// ===== Main Script Logic =====

async function main(): Promise<void> {
	const User = (await import('../server/src/database/user/mongoose/user.model.js')).default;
	const Location = (await import('../server/src/database/location/mongoose/location.model.js')).default;
	const connectDB = (await import('../server/src/database/index.js')).default;
	const { createUserSchema, updateUserSchema } = await import('../server/src/database/user/zod/user.validator.js');

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
				if (args.length < 6) {
					console.error(
						'Error: create requires 5 arguments: <firstName> <lastName> <email> <phone> <locationId>',
					);
					process.exit(1);
				}
				await createSuperAdmin(args[1], args[2], args[3], args[4], args[5], User, Location, createUserSchema);
				break;

			case 'list':
				const includeDeleted = args.includes('--all');
				await listSuperAdmins(User, Location, includeDeleted);
				break;

			case 'get':
				if (args.length < 2) {
					console.error('Error: get requires 1 argument: <email|phone|objectId>');
					process.exit(1);
				}
				await getSuperAdmin(args[1], User, Location);
				break;

			case 'update': {
				if (args.length < 3) {
					console.error('Error: update requires at least identifier and one update flag');
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
							case 'firstName':
								updates.firstName = value;
								break;
							case 'lastName':
								updates.lastName = value;
								break;
							case 'email':
								updates.email = value;
								break;
							case 'phone':
								updates.phone = normalizePhone(value);
								break;
							case 'location':
								updates.locationObjectId = value;
								break;
							case 'status':
								updates.approvalStatus = value;
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

				await updateSuperAdmin(identifier, updates, User, Location, updateUserSchema);
				break;
			}

			case 'delete':
				if (args.length < 2) {
					console.error('Error: delete requires 1 argument: <email|phone|objectId>');
					process.exit(1);
				}
				const hardDelete = args.includes('--hard');
				await deleteSuperAdmin(args[1], hardDelete, User);
				break;

			case 'restore':
				if (args.length < 2) {
					console.error('Error: restore requires 1 argument: <email|phone|objectId>');
					process.exit(1);
				}
				await restoreSuperAdmin(args[1], User);
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
Usage: npm run super-admin -- <operation> [args]

Operations:

  create <firstName> <lastName> <email> <phone> <locationId>
    Create a new super admin user
    Example: npm run super-admin -- create John Doe john@example.com +15551234567 507f1f77bcf86cd799439011

  list [--all]
    List all super admins (use --all to include soft-deleted)
    Example: npm run super-admin -- list
    Example: npm run super-admin -- list --all

  get <email|phone|objectId>
    Get details of a specific super admin
    Example: npm run super-admin -- get john@example.com
    Example: npm run super-admin -- get 5551234567
    Example: npm run super-admin -- get +15551234567
    Example: npm run super-admin -- get 507f1f77bcf86cd799439011

  update <email|phone|objectId> [options]
    Update super admin details. Available options:
      --firstName <name>    Update first name
      --lastName <name>     Update last name
      --email <email>       Update email address
      --phone <phone>       Update phone number (+1XXXXXXXXXX or XXXXXXXXXX format)
      --location <id>       Update location ObjectId
      --status <status>     Update approval status (PENDING|APPROVED|REJECTED)
    Example: npm run super-admin -- update john@example.com --firstName Jane --email jane@example.com
    Example: npm run super-admin -- update 5551234567 --email newemail@example.com

  delete <email|phone|objectId> [--hard]
    Delete a super admin (soft delete by default, use --hard for permanent)
    Example: npm run super-admin -- delete john@example.com
    Example: npm run super-admin -- delete 5551234567 --hard

  restore <email|phone|objectId>
    Restore a soft-deleted super admin
    Example: npm run super-admin -- restore john@example.com
    Example: npm run super-admin -- restore 5551234567
	`);
}

// Run the script
main();
