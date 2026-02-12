#!/usr/bin/env tsx
/**
 * Script to generate N seeds for a given location
 * Usage: npm run generate-seeds -- <hubName|objectId> <count> [templateKey]
 *
 * Examples:
 *   npm run generate-seeds -- "My Friends Place" 10
 *   npm run generate-seeds -- "My Friends Place" 10 seattle
 *   npm run generate-seeds -- 692f9100056e7a6957d0f0a2 50 east
 *
 * Available templates: seattle, north, east, south, southeast, snoqualmie valley, vashon
 * Default template: seattle
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== Location Template Configuration =====

interface LocationInfo {
    name: string;
    address: string;
    daysEn?: string;
    daysEs?: string;
    hoursEn?: string;
    hoursEs?: string;
}

interface LocationTemplate {
    headerEn: string;
    headerEs: string;
    subheaderEn: string;
    subheaderEs: string;
    subsubheaderEn: string;
    subsubheaderEs: string;
    warningEn: string;
    warningEs: string;
    locations: LocationInfo[];
}

// Load templates from external JSON file
function loadTemplates(): Record<string, LocationTemplate> {
    const templatesPath = path.join(__dirname, 'seed_templates.json');
    try {
        const templatesContent = fs.readFileSync(templatesPath, 'utf-8');
        return JSON.parse(templatesContent);
    } catch (error) {
        throw new Error(`Failed to load seed templates from ${templatesPath}: ${error instanceof Error ? error.message : error}`);
    }
}

// ===== PDF Generation Helper Functions =====

function createOutputDirectory(): string {
    const outputDir = path.join(__dirname, 'seeds');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
}

function generateTimestampFilename(templateKey: string, count: number, outputDir: string): string {
    const now = new Date();
    const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('');
    const sanitizedTemplateKey = templateKey.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `kcrha-pit-2026-${sanitizedTemplateKey}-${count}-seeds-${timestamp}.pdf`;
    return path.join(outputDir, filename);
}

async function generateQRCodeBuffer(surveyCode: string, qrSize: number): Promise<Buffer> {
    // Encode only the referral code (no URL) so QR codes work across any deployment
    const qrDataUrl = await QRCode.toDataURL(surveyCode, {
        width: qrSize,
        margin: 1,
        errorCorrectionLevel: 'M',
    });
    return Buffer.from(qrDataUrl.split(',')[1], 'base64');
}

// ===== Simplified English Page =====

async function addEnglishPage(doc: any, surveyCode: string, template: LocationTemplate): Promise<void> {
    const pageWidth = doc.page.width;
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // --- Top: KCRHA Logo ---
    let currentY = margin;
    const logoPath = path.join(__dirname, 'assets', 'kcrha_logo.png');
    const logoWidth = 150;
    doc.image(logoPath, margin, currentY, { width: logoWidth });
    currentY += 45;

    // --- Title ---
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Coupon — Unsheltered Point-in-Time Count', margin, currentY, { width: contentWidth });
    currentY += 20;

    // --- QR code box (top right corner) ---
    const qrSize = 100;
    const qrX = pageWidth - margin - qrSize;
    const qrStartY = currentY;
    const qrBuffer = await generateQRCodeBuffer(surveyCode, qrSize);
    doc.rect(qrX - 2, qrStartY - 2, qrSize + 4, qrSize + 4).stroke('#000000');
    doc.image(qrBuffer, qrX, qrStartY, { width: qrSize, height: qrSize });
    doc.fontSize(10).font('Helvetica-Bold').text(surveyCode, qrX, qrStartY + qrSize + 4, { width: qrSize, align: 'center' });
    const qrEndY = qrStartY + qrSize + 14; // QR code + text below

    // --- Subheader text (beside QR code) ---
    const textWidth = contentWidth - qrSize - 20;
    doc.fontSize(10)
        .font('Helvetica')
        .text(template.subheaderEn, margin, currentY, { width: textWidth });

    const subheaderHeight = doc.heightOfString(template.subheaderEn, { width: textWidth });
    currentY += subheaderHeight + 6;

    // --- Subsubheader text (next line, same width) ---
    doc.fontSize(10)
        .font('Helvetica')
        .text(template.subsubheaderEn, margin, currentY, { width: textWidth });

    const subsubheaderHeight = doc.heightOfString(template.subsubheaderEn, { width: textWidth });
    currentY += subsubheaderHeight;

    // Move currentY to whichever ends first (text or QR)
    currentY = Math.min(currentY + 20, qrEndY);

    // --- Locations header ---
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(template.headerEn, margin, currentY, { width: contentWidth });
    currentY += 16;

    // --- Locations list ---
    for (const location of template.locations) {
        // Location name (bold)
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
        doc.text(location.name, margin, currentY, { width: contentWidth });
        currentY += doc.heightOfString(location.name, { width: contentWidth }) + 3;

        // Address
        doc.fontSize(10).font('Helvetica');
        doc.text(location.address, margin, currentY, { width: contentWidth });
        currentY += doc.heightOfString(location.address, { width: contentWidth }) + 3;

        // Days and Hours (combined if both exist)
        const parts = [];
        if (location.daysEn) parts.push(location.daysEn);
        if (location.hoursEn) parts.push(location.hoursEn);
        if (parts.length > 0) {
            const timeInfo = parts.join(', ');
            doc.text(timeInfo, margin, currentY, { width: contentWidth });
            currentY += doc.heightOfString(timeInfo, { width: contentWidth });
        }

        currentY += 10; // Space between locations
    }

    // --- Footer (positioned at bottom of page) ---
    const pageHeight = doc.page.height;
    const footerY = pageHeight - margin - 40; // Reserve space at bottom
    doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(template.warningEn, margin, footerY, { width: contentWidth, align: 'left', lineGap: 2 });
}

// ===== Simplified Spanish Page =====

async function addSpanishPage(doc: any, surveyCode: string, template: LocationTemplate): Promise<void> {
    const pageWidth = doc.page.width;
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;

    // --- Top: KCRHA Logo ---
    let currentY = margin;
    const logoPath = path.join(__dirname, 'assets', 'kcrha_logo.png');
    const logoWidth = 150;
    doc.image(logoPath, margin, currentY, { width: logoWidth });
    currentY += 45;

    // --- Title ---
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .text('Cupón — Un recuento de personas sin hogar', margin, currentY, { width: contentWidth });
    currentY += 20;

    // --- QR code box (top right corner) ---
    const qrSize = 100;
    const qrX = pageWidth - margin - qrSize;
    const qrStartY = currentY;
    const qrBuffer = await generateQRCodeBuffer(surveyCode, qrSize);
    doc.rect(qrX - 2, qrStartY - 2, qrSize + 4, qrSize + 4).stroke('#000000');
    doc.image(qrBuffer, qrX, qrStartY, { width: qrSize, height: qrSize });
    doc.fontSize(10).font('Helvetica-Bold').text(surveyCode, qrX, qrStartY + qrSize + 4, { width: qrSize, align: 'center' });
    const qrEndY = qrStartY + qrSize + 14; // QR code + text below

    // --- Subheader text (beside QR code) ---
    const textWidth = contentWidth - qrSize - 20;
    doc.fontSize(10)
        .font('Helvetica')
        .text(template.subheaderEs, margin, currentY, { width: textWidth });

    const subheaderHeight = doc.heightOfString(template.subheaderEs, { width: textWidth });
    currentY += subheaderHeight + 6;

    // --- Subsubheader text (next line, same width) ---
    doc.fontSize(10)
        .font('Helvetica')
        .text(template.subsubheaderEs, margin, currentY, { width: textWidth });

    const subsubheaderHeight = doc.heightOfString(template.subsubheaderEs, { width: textWidth });
    currentY += subsubheaderHeight;

    // Move currentY past both sections (text or QR, whichever is lower)
    currentY = Math.min(currentY + 20, qrEndY);

    // --- Locations header ---
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(template.headerEs, margin, currentY, { width: contentWidth });
    currentY += 16;

    // --- Locations list ---
    for (const location of template.locations) {
        // Location name (bold)
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
        doc.text(location.name, margin, currentY, { width: contentWidth });
        currentY += doc.heightOfString(location.name, { width: contentWidth }) + 3;

        // Address
        doc.fontSize(10).font('Helvetica');
        doc.text(location.address, margin, currentY, { width: contentWidth });
        currentY += doc.heightOfString(location.address, { width: contentWidth }) + 3;

        // Days and Hours (combined if both exist)
        const parts = [];
        if (location.daysEs) parts.push(location.daysEs);
        if (location.hoursEs) parts.push(location.hoursEs);
        if (parts.length > 0) {
            const timeInfo = parts.join(', ');
            doc.text(timeInfo, margin, currentY, { width: contentWidth });
            currentY += doc.heightOfString(timeInfo, { width: contentWidth });
        }

        currentY += 10; // Space between locations
    }

    // --- Footer (positioned at bottom of page) ---
    const pageHeight = doc.page.height;
    const footerY = pageHeight - margin - 40; // Reserve space at bottom
    doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#000000')
        .text(template.warningEs, margin, footerY, { width: contentWidth, align: 'left', lineGap: 2 });
}

async function generatePDF(seeds: any[], templateKey: string = 'seattle'): Promise<void> {
    const outputDir = createOutputDirectory();
    const filepath = generateTimestampFilename(templateKey, seeds.length, outputDir);

    // Load and get the location template
    const templates = loadTemplates();
    const template = templates[templateKey];
    if (!template) {
        throw new Error(`Template "${templateKey}" not found. Available templates: ${Object.keys(templates).join(', ')}`);
    }

    const doc = new PDFDocument({
        size: 'LETTER',
        margin: 30,
        autoFirstPage: false
    });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Generate two-sided coupons (English + Spanish) for each seed
    for (const seed of seeds) {
        // Add English page
        doc.addPage();
        await addEnglishPage(doc, seed.surveyCode, template);
        
        // Add Spanish page
        doc.addPage();
        await addSpanishPage(doc, seed.surveyCode, template);
    }

    doc.end();

    await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
    });

    console.log(`\n✓ PDF generated: ${filepath}`);
    console.log(`  Total pages: ${seeds.length * 2} (${seeds.length} English + ${seeds.length} Spanish)`);
    console.log(`  Using template: ${templateKey}`);
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

async function createSeed(surveyCode: string, locationId: any, Seed: any, templateKey: string, index: number, total: number): Promise<any> {
    try {
        const seed = await Seed.create({
            surveyCode,
            locationObjectId: locationId,
            isFallback: false,
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
    generateUniqueSurveyCode: () => Promise<string>,
    templateKey: string,
): Promise<any[]> {
    console.log(`Generating ${count} seed(s)...\n`);
    const createdSeeds: any[] = [];

    for (let i = 0; i < count; i++) {
        const surveyCode = await generateUniqueSurveyCode();
        const seed = await createSeed(surveyCode, location._id, Seed, templateKey, i, count);
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

async function generateSeeds(locationIdentifier: string, count: number, templateKey?: string): Promise<void> {
    const Location = (await import('@/database/location/mongoose/location.model')).default;
    const Seed = (await import('@/database/seed/mongoose/seed.model')).default;
    const { generateUniqueSurveyCode } = await import('@/database/survey/survey.controller');
    const connectDB = (await import('@/database/index')).default;

    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database ✓\n');

        const location = await findLocationByIdentifier(locationIdentifier, Location);
        const createdSeeds = await generateSeedsForLocation(location, count, Seed, generateUniqueSurveyCode, templateKey || 'seattle');

        printSeedsSummary(createdSeeds, location.hubName);

        console.log('\n📄 Generating PDF with QR codes...');
        await generatePDF(createdSeeds, templateKey);
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

if (args.length < 2 || args.length > 3) {
    const templates = loadTemplates();
    console.error('Usage: npm run generate-seeds -- <hubName|objectId> <count> [templateKey]');
    console.error('');
    console.error('Examples:');
    console.error('  npm run generate-seeds -- "My Friends Place" 10');
    console.error('  npm run generate-seeds -- 507f1f77bcf86cd799439011 100 metro');
    console.error('  npm run generate-seeds -- 692fc19f0d01f4b400e665d0 50 east');
    console.error('');
    console.error('Available templates:');
    Object.keys(templates).forEach(key => {
        const template = templates[key];
        console.error(`  - ${key}: ${template.headerEn}`);
    });
    console.error('');
    console.error('Default template: seattle');
    process.exit(1);
}

const [locationIdentifier, countStr, templateKey] = args;
const count = parseInt(countStr, 10);

if (isNaN(count) || count <= 0) {
    console.error('Error: count must be a positive number');
    process.exit(1);
}

// Run the script
generateSeeds(locationIdentifier, count, templateKey);
