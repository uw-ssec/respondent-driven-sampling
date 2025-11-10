#!/usr/bin/env tsx
/**
 * Script to generate N seeds for a given location
 * Usage: npm run generate-seeds -- <hubName|objectId> <count>
 * Example: npm run generate-seeds -- "Main Hub" 10
 * Example: npm run generate-seeds -- 507f1f77bcf86cd799439011 10
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';
import mongoose from 'mongoose';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create require from server directory to access server's node_modules
const serverRequire = createRequire(path.join(__dirname, '../server/package.json'));
const QRCode = serverRequire('qrcode');
const PDFDocument = serverRequire('pdfkit');

// ===== PDF Generation Helper Functions =====

function createOutputDirectory(): string {
	const outputDir = path.join(__dirname, 'seeds');
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}
	return outputDir;
}

function generateTimestampFilename(locationName: string, outputDir: string): string {
	const now = new Date();
	const timestamp = [
		now.getFullYear(),
		String(now.getMonth() + 1).padStart(2, '0'),
		String(now.getDate()).padStart(2, '0'),
		String(now.getHours()).padStart(2, '0'),
		String(now.getMinutes()).padStart(2, '0'),
		String(now.getSeconds()).padStart(2, '0')
	].join('');
	const sanitizedLocationName = locationName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
	const filename = `seeds-${sanitizedLocationName}-${timestamp}.pdf`;
	return path.join(outputDir, filename);
}

async function generateQRCodeBuffer(surveyCode: string, baseUrl: string, qrSize: number): Promise<Buffer> {
	const qrUrl = `${baseUrl}/survey?ref=${surveyCode}`;
	const qrDataUrl = await QRCode.toDataURL(qrUrl, {
		width: qrSize,
		margin: 1,
		errorCorrectionLevel: 'M'
	});
	return Buffer.from(qrDataUrl.split(',')[1], 'base64');
}

async function addQRCodePage(
	doc: any,
	surveyCode: string,
	locationName: string,
	baseUrl: string,
	isFirstPage: boolean
): Promise<void> {
	if (!isFirstPage) {
		doc.addPage();
	}

	const pageWidth = doc.page.width;
	const pageHeight = doc.page.height;
	const qrSize = 200;

	// Generate and position QR code
	const qrBuffer = await generateQRCodeBuffer(surveyCode, baseUrl, qrSize);
	const qrX = (pageWidth - qrSize) / 2;
	const qrY = (pageHeight - qrSize) / 2 - 50;

	doc.image(qrBuffer, qrX, qrY, {
		width: qrSize,
		height: qrSize
	});

	// Add referral code text
	doc.fontSize(20)
		.font('Helvetica-Bold')
		.text(`Referral Code: ${surveyCode}`, 0, qrY + qrSize + 30, {
			align: 'center',
			width: pageWidth
		});

	// Add location text
	doc.fontSize(12)
		.font('Helvetica')
		.text(`Location: ${locationName}`, 0, pageHeight - 80, {
			align: 'center',
			width: pageWidth
		});
}

async function generatePDF(seeds: any[], locationName: string): Promise<void> {
	const outputDir = createOutputDirectory();
	const filepath = generateTimestampFilename(locationName, outputDir);

	// Create PDF document
	const doc = new PDFDocument({
		size: 'LETTER',
		margin: 50
	});

	const stream = fs.createWriteStream(filepath);
	doc.pipe(stream);

	// BE SURE TO SET THIS TO CORRECT URL IN ENV
	const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';

	// Generate one page per seed
	for (let i = 0; i < seeds.length; i++) {
		await addQRCodePage(doc, seeds[i].surveyCode, locationName, baseUrl, i === 0);
	}

	doc.end();

	// Wait for stream to finish
	await new Promise((resolve, reject) => {
		stream.on('finish', resolve);
		stream.on('error', reject);
	});

	console.log(`\n✓ PDF generated: ${filepath}`);
	console.log(`  Contains ${seeds.length} QR code(s), one per page`);
}

// ===== Seed Generation Helper Functions =====

function isValidObjectId(identifier: string): boolean {
	return mongoose.Types.ObjectId.isValid(identifier) && /^[0-9a-fA-F]{24}$/.test(identifier);
}

async function findLocationByIdentifier(locationIdentifier: string, Location: any): Promise<any> {
	const isObjectId = isValidObjectId(locationIdentifier);
	
	let location;
	if (isObjectId) {
		console.log(`Looking up location with ObjectId: "${locationIdentifier}"...`);
		location = await Location.findById(locationIdentifier);
	} else {
		console.log(`Looking up location with hubName: "${locationIdentifier}"...`);
		location = await Location.findOne({ hubName: locationIdentifier });
	}
	
	if (!location) {
		const idType = isObjectId ? 'ObjectId' : 'hubName';
		throw new Error(`Location with ${idType} "${locationIdentifier}" not found`);
	}
	
	console.log(`Found location: ${location.hubName} (${location._id}) ✓\n`);
	return location;
}

async function createSeed(
	surveyCode: string,
	locationId: any,
	Seed: any,
	index: number,
	total: number
): Promise<any> {
	try {
		const seed = await Seed.create({
			surveyCode,
			locationObjectId: locationId,
			isFallback: false
		});
		
		console.log(`  [${index + 1}/${total}] Created seed: ${seed.surveyCode} (${seed._id})`);
		return seed;
	} catch (error) {
		console.error(`  [${index + 1}/${total}] Failed to create seed:`, error);
		throw error;
	}
}

async function generateSeedsForLocation(
	location: any,
	count: number,
	Seed: any,
	generateUniqueSurveyCode: () => Promise<string>
): Promise<any[]> {
	console.log(`Generating ${count} seed(s)...\n`);
	const createdSeeds: any[] = [];
	
	for (let i = 0; i < count; i++) {
		const surveyCode = await generateUniqueSurveyCode();
		const seed = await createSeed(surveyCode, location._id, Seed, i, count);
		createdSeeds.push(seed);
	}
	
	return createdSeeds;
}

function printSeedsSummary(seeds: any[], locationName: string): void {
	console.log(`\n✓ Successfully generated ${seeds.length} seed(s) for location "${locationName}"`);
	console.log('\nGenerated Survey Codes:');
	seeds.forEach((seed, index) => {
		console.log(`  ${index + 1}. ${seed.surveyCode}`);
	});
}

async function generateSeeds(locationIdentifier: string, count: number): Promise<void> {
	const Location = (await import('../server/src/database/location/mongoose/location.model.js')).default;
	const Seed = (await import('../server/src/database/seed/mongoose/seed.model.js')).default;
	const { generateUniqueSurveyCode } = await import('../server/src/database/survey/survey.controller.js');
	const connectDB = (await import('../server/src/database/index.js')).default;
	
	try {
		console.log('Connecting to database...');
		await connectDB();
		console.log('Connected to database ✓\n');

		const location = await findLocationByIdentifier(locationIdentifier, Location);
		const createdSeeds = await generateSeedsForLocation(location, count, Seed, generateUniqueSurveyCode);
		
		printSeedsSummary(createdSeeds, location.hubName);
		
		console.log('\n📄 Generating PDF with QR codes...');
		await generatePDF(createdSeeds, location.hubName);

	} catch (error) {
		console.error('\n✗ Error:', error instanceof Error ? error.message : error);
		process.exit(1);
	} finally {
		await mongoose.connection.close();
		console.log('\nDatabase connection closed.');
		process.exit(0);
	}
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
	console.error('Usage: npm run generate-seeds -- <hubName|objectId> <count>');
	console.error('Example: npm run generate-seeds -- "Main Hub" 10');
	console.error('Example: npm run generate-seeds -- 507f1f77bcf86cd799439011 10');
	process.exit(1);
}

const [locationIdentifier, countStr] = args;
const count = parseInt(countStr, 10);

if (isNaN(count) || count <= 0) {
	console.error('Error: count must be a positive number');
	process.exit(1);
}

// Run the script
generateSeeds(locationIdentifier, count);

