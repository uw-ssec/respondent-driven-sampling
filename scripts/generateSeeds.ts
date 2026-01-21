#!/usr/bin/env tsx
/**
 * Script to generate N seeds for a given location with LA Youth Count PDF format
 * Usage: npm run generate-seeds -- <hubName|objectId> <count> [templateKey]
 * 
 * Examples:
 *   npm run generate-seeds -- "My Friends Place" 10
 *   npm run generate-seeds -- "My Friends Place" 10 metro
 *   npm run generate-seeds -- 692f9100056e7a6957d0f0a2 50 east
 * 
 * Available templates: metro, east, antelope, south, west
 * Default template: metro
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create require from server directory to access server's node_modules
const serverRequire = createRequire(path.join(__dirname, '../server/package.json'));
const QRCode = serverRequire('qrcode');
const PDFDocument = serverRequire('pdfkit');
const mongoose = serverRequire('mongoose');

// ===== Location Template Configuration =====

interface LocationInfo {
    name: string;
    address: string;
    hoursEn: string;
    hoursEs: string;
}

interface LocationTemplate {
    headerEn: string;
    headerEs: string;
    subheaderEn: string;
    subheaderEs: string;
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
    const filename = `la-youth-count-seeds-${sanitizedLocationName}-${timestamp}.pdf`;
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

function renderLocationsTable(
    doc: any,
    locations: LocationInfo[],
    tableY: number,
    margin: number,
    contentWidth: number,
    useSpanish: boolean = false
): void {
    const tableHeight = 230;
    
    // Draw outer border (without top)
    doc.lineWidth(2)
        .rect(margin, tableY, contentWidth, tableHeight)
        .stroke();

    // Column configuration
    const colPadding = 10;
    const colGap = 10;
    const col1X = margin + colPadding;
    const col1Width = (contentWidth - colGap - colPadding * 2) / 2;
    const col2X = margin + col1Width + colGap + colPadding;
    const col2Width = col1Width;

    // Determine how many locations per column
    const locationsPerColumn = Math.ceil(locations.length / 2);
    const leftLocations = locations.slice(0, locationsPerColumn);
    const rightLocations = locations.slice(locationsPerColumn);

    // Render left column
    let leftY = tableY + 16;
    for (const location of leftLocations) {
        const hours = useSpanish ? location.hoursEs : location.hoursEn;
        
        doc.fontSize(11.5).font('Helvetica-Bold').fillColor('#1a1a1a');
        let textHeight = doc.heightOfString(location.name, { width: col1Width - colPadding });
        doc.text(location.name, col1X, leftY, {
            width: col1Width - colPadding,
            align: 'left'
        });
        leftY += textHeight + 5;

        doc.fontSize(11.5).font('Helvetica');
        textHeight = doc.heightOfString(location.address, { width: col1Width - colPadding });
        doc.text(location.address, col1X, leftY, {
            width: col1Width - colPadding,
            align: 'left'
        });
        leftY += textHeight + 5;

        textHeight = doc.heightOfString(hours, { width: col1Width - colPadding });
        doc.text(hours, col1X, leftY, {
            width: col1Width - colPadding,
            align: 'left'
        });
        leftY += textHeight + 15;
    }

    // Render right column
    let rightY = tableY + 16;
    for (const location of rightLocations) {
        const hours = useSpanish ? location.hoursEs : location.hoursEn;
        
        doc.fontSize(11.5).font('Helvetica-Bold').fillColor('#1a1a1a');
        let textHeight = doc.heightOfString(location.name, { width: col2Width - colPadding });
        doc.text(location.name, col2X, rightY, {
            width: col2Width - colPadding,
            align: 'left'
        });
        rightY += textHeight + 5;

        doc.fontSize(11.5).font('Helvetica');
        textHeight = doc.heightOfString(location.address, { width: col2Width - colPadding });
        doc.text(location.address, col2X, rightY, {
            width: col2Width - colPadding,
            align: 'left'
        });
        rightY += textHeight + 5;

        textHeight = doc.heightOfString(hours, { width: col2Width - colPadding });
        doc.text(hours, col2X, rightY, {
            width: col2Width - colPadding,
            align: 'left'
        });
        rightY += textHeight + 15;
    }
}

async function addEnglishPage(doc: any, surveyCode: string, template: LocationTemplate): Promise<void> {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    let currentY = margin;

    // Header with title and QR code
    const qrSize = 120;
    const qrX = pageWidth - margin - qrSize;
    const titleWidth = qrX - margin - 10;

    // Title
    doc.fontSize(21)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('LOS ANGELES YOUTH COUNT', margin, currentY, {
            width: titleWidth,
            align: 'left'
        });

    currentY += 40;

    doc.fontSize(15)
        .font('Helvetica-Bold')
        .text('UNSHELTERED YOUTH COUNT COUPON', margin, currentY, {
            width: titleWidth,
            align: 'left'
        });

    // QR Code - ACTUAL QR CODE INSTEAD OF PLACEHOLDER
    const qrBuffer = await generateQRCodeBuffer(surveyCode, qrSize);
    doc.image(qrBuffer, qrX, margin, {
        width: qrSize,
        height: qrSize
    });

    // Display survey code below QR code as blue hyperlink
    const qrCodeTextY = margin + qrSize + 5;
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a ')
        .text(surveyCode, qrX, qrCodeTextY, {
            width: qrSize,
            align: 'center',
            link: `https://respondent-driven-sampling.azurewebsites.net/apply-referral?surveyCode=${surveyCode}`,
            underline: false
        });

    currentY = margin + qrSize + 20;

    // Intro paragraph
    const introText = 'Young people under the age of 25 who are sleeping outside or in RVs, cars, or other locations not meant for human habitation are needed for a survey from January 5th through 31st. ';
    const introBoldText = 'PLEASE BRING THIS COUPON TO A LOCATION BELOW.';
    
    const fullIntroText = introText + introBoldText;
    const introHeight = doc.heightOfString(fullIntroText, {
        width: contentWidth,
        align: 'justify'
    });
    
    doc.fontSize(11.5)
        .font('Helvetica')
        .text(introText, margin, currentY, {
            width: contentWidth,
            align: 'justify',
            continued: true
        })
        .font('Helvetica-Bold')
        .text(introBoldText);

    currentY += introHeight + 35;

    // Incentive
    const incentiveText = '$20 Visa cards will be provided to those who complete the survey!';
    const incentiveHeight = doc.heightOfString(incentiveText, {
        width: contentWidth
    });
    
    doc.fontSize(11.5)
        .font('Helvetica-Bold')
        .text(incentiveText, margin, currentY, {
            width: contentWidth,
            align: 'left'
        });

    currentY += incentiveHeight + 20;

    // Hub sites header box
    const hubBoxY = currentY;
    const hubBoxHeight = 75;
    
    doc.rect(margin, hubBoxY, contentWidth, hubBoxHeight)
        .fillAndStroke('#f9f9f9', '#1a1a1a');

    doc.fillColor('#1a1a1a')
        .fontSize(14.5)
        .font('Helvetica-Bold')
        .text(template.headerEn, margin + 15, hubBoxY + 12, {
            width: contentWidth - 30,
            align: 'center'
        });

    // Calculate centered position for the hub sites text with blue link
    const hubSitesFullText = template.subheaderEn;
    const hubSitesFullTextWidth = doc.widthOfString(hubSitesFullText);
    const hubSitesStartX = margin + 15 + (contentWidth - 30 - hubSitesFullTextWidth) / 2;

    doc.fontSize(10.75)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text('View all Hub Sites in LA County at ', hubSitesStartX, hubBoxY + 35, {
            continued: true
        })
        .fillColor('#1a1a1a')
        .text('youthcount.org/map', {
            link: 'https://youthcount.org/map',
            underline: true
        });

    doc.fontSize(9.25)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text(template.warningEn, margin + 15, hubBoxY + 55, {
            width: contentWidth - 30,
            align: 'center'
        });

    currentY = hubBoxY + hubBoxHeight;

    // Locations table
    const tableY = currentY;
    renderLocationsTable(doc, template.locations, tableY, margin, contentWidth, false);
    
    currentY = tableY + 230 + 15;

    // Uber section
    const uberBoxY = currentY;
    const uberBoxHeight = 92;
    
    doc.rect(margin, uberBoxY, contentWidth, uberBoxHeight)
        .fillAndStroke('#f9f9f9', '#000000');
    
    // Add left border accent
    doc.lineWidth(4)
        .moveTo(margin, uberBoxY)
        .lineTo(margin, uberBoxY + uberBoxHeight)
        .stroke('#000000');

    doc.fillColor('#1a1a1a')
        .fontSize(11.5)
        .font('Helvetica-Bold')
        .text('$10 off your Uber rides to and from a hub site with this voucher', margin + 12, uberBoxY + 12, {
            width: contentWidth - 24,
            align: 'left'
        });

    let uberY = uberBoxY + 32;
    
    const voucherLineText = '• UBER VOUCHER: RKRBSSFQJFS https://r.uber.com/rkrbssfqjfs';
    doc.fontSize(11.5).font('Helvetica');
    const voucherHeight = doc.heightOfString(voucherLineText, { width: contentWidth - 24 });
    
    doc.text('• UBER VOUCHER: ', margin + 12, uberY, {
        width: contentWidth - 24,
        align: 'left',
        continued: true
    })
    .font('Courier-Bold')
    .text('RKRBSSFQJFS ', { continued: true })
    .font('Helvetica')
    .fillColor('#1a1a1a')
    .text('https://r.uber.com/rkrbssfqjfs', {
        link: 'https://r.uber.com/rkrbssfqjfs',
        underline: true
    });

    uberY += voucherHeight + 8;

    const uberDetailsText = '• Receive $10 off of 2 Uber trips to and from any designated Hub sites during surveying times using the voucher code. Visit youthcount.org/uber for more details.';
    doc.fontSize(11.5).font('Helvetica').fillColor('#1a1a1a');
    const detailsHeight = doc.heightOfString(uberDetailsText, { width: contentWidth - 24 });
    
    doc.text(uberDetailsText, margin + 12, uberY, {
        width: contentWidth - 24,
        align: 'left'
    });

    currentY = uberBoxY + uberBoxHeight + 12;

    // Footer
    doc.moveTo(margin, currentY)
        .lineTo(pageWidth - margin, currentY)
        .lineWidth(2)
        .stroke('#dddddd');

    currentY += 10;

    doc.fontSize(11.5)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text('Data will be used to report to Housing and Urban Development (HUD). More info at ', margin, currentY, {
            width: contentWidth,
            align: 'left',
            continued: true
        })
        .fillColor('#1a1a1a')
        .text('youthcount.org', {
            link: 'https://youthcount.org',
            underline: true
        });
}

async function addSpanishPage(doc: any, surveyCode: string, template: LocationTemplate): Promise<void> {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    let currentY = margin;

    // Header with title and QR code
    const qrSize = 120;
    const qrX = pageWidth - margin - qrSize;
    const titleWidth = qrX - margin - 10;

    // Title
    doc.fontSize(21)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('LOS ANGELES YOUTH COUNT', margin, currentY, {
            width: titleWidth,
            align: 'left'
        });

    currentY += 40;

    doc.fontSize(15)
        .font('Helvetica-Bold')
        .text('CUPÓN DEL CONTEO DE JÓVENES SIN HOGAR', margin, currentY, {
            width: titleWidth,
            align: 'left'
        });

    // QR Code - ACTUAL QR CODE INSTEAD OF PLACEHOLDER
    const qrBuffer = await generateQRCodeBuffer(surveyCode, qrSize);
    doc.image(qrBuffer, qrX, margin, {
        width: qrSize,
        height: qrSize
    });

    // Display survey code below QR code as blue hyperlink
    const qrCodeTextY = margin + qrSize + 5;
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a ')
        .text(surveyCode, qrX, qrCodeTextY, {
            width: qrSize,
            align: 'center',
            link: `https://respondent-driven-sampling.azurewebsites.net/apply-referral?surveyCode=${surveyCode}`,
            underline: false
        });

    currentY = margin + qrSize + 20;

    // Intro paragraph
    const introText = 'Se necesitan jóvenes menores de 25 años que estén durmiendo afuera o en vehículos recreativos, autos u otros lugares no destinados para la habitación humana para una encuesta del 5 al 31 de enero. ';
    const introBoldText = '¡LLEVE ESTE CUPÓN A UNO DE LOS LUGARES INDICADOS ABAJO!';
    
    const fullIntroText = introText + introBoldText;
    const introHeight = doc.heightOfString(fullIntroText, {
        width: contentWidth,
        align: 'justify'
    });
    
    doc.fontSize(11.5)
        .font('Helvetica')
        .text(introText, margin, currentY, {
            width: contentWidth,
            align: 'justify',
            continued: true
        })
        .font('Helvetica-Bold')
        .text(introBoldText);

    currentY += introHeight + 20;

    // Incentive
    const incentiveText = '¡TARJETA VISA DE $20 después de completar una encuesta!';
    const incentiveHeight = doc.heightOfString(incentiveText, {
        width: contentWidth
    });
    
    doc.fontSize(11.5)
        .font('Helvetica-Bold')
        .text(incentiveText, margin, currentY, {
            width: contentWidth,
            align: 'left'
        });

    currentY += incentiveHeight + 20;

    // Hub sites header box
    const hubBoxY = currentY;
    const hubBoxHeight = 75;
    
    doc.rect(margin, hubBoxY, contentWidth, hubBoxHeight)
        .fillAndStroke('#f9f9f9', '#1a1a1a');

    doc.fillColor('#1a1a1a')
        .fontSize(14.5)
        .font('Helvetica-Bold')
        .text(template.headerEs, margin + 15, hubBoxY + 12, {
            width: contentWidth - 30,
            align: 'center'
        });

    // Calculate centered position for the hub sites text with blue link
    const hubSitesFullTextEs = template.subheaderEs;
    const hubSitesFullTextWidthEs = doc.widthOfString(hubSitesFullTextEs);
    const hubSitesStartXEs = margin + 15 + (contentWidth - 30 - hubSitesFullTextWidthEs) / 2;

    doc.fontSize(10.75)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text('Vea los Centros (Hubs) en el Condado de Los Ángeles en ', hubSitesStartXEs, hubBoxY + 35, {
            continued: true
        })
        .fillColor('#1a1a1a')
        .text('youthcount.org/map', {
            link: 'https://youthcount.org/map',
            underline: true
        });

    doc.fontSize(9.25)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text(template.warningEs, margin + 15, hubBoxY + 55, {
            width: contentWidth - 30,
            align: 'center'
        });

    currentY = hubBoxY + hubBoxHeight;

    // Locations table (Spanish version)
    const tableY = currentY;
    renderLocationsTable(doc, template.locations, tableY, margin, contentWidth, true);
    
    currentY = tableY + 230 + 15;

    // Uber section
    const uberBoxY = currentY;
    const uberBoxHeight = 92;
    
    doc.rect(margin, uberBoxY, contentWidth, uberBoxHeight)
        .fillAndStroke('#f9f9f9', '#000000');
    
    // Add left border accent
    doc.lineWidth(4)
        .moveTo(margin, uberBoxY)
        .lineTo(margin, uberBoxY + uberBoxHeight)
        .stroke('#000000');

    doc.fillColor('#1a1a1a')
        .fontSize(11.5)
        .font('Helvetica-Bold')
        .text('Ahorre $10 en sus viajes de Uber (ida y vuelta) con este código', margin + 12, uberBoxY + 12, {
            width: contentWidth - 24,
            align: 'left'
        });

    let uberY = uberBoxY + 32;
    
    const voucherLineText = '• CUPÓN DE UBER: RKRBSSFQJFS https://r.uber.com/rkrbssfqjfs';
    doc.fontSize(11.5).font('Helvetica');
    const voucherHeight = doc.heightOfString(voucherLineText, { width: contentWidth - 24 });
    
    doc.text('• CUPÓN DE UBER: ', margin + 12, uberY, {
        width: contentWidth - 24,
        align: 'left',
        continued: true
    })
    .font('Courier-Bold')
    .text('RKRBSSFQJFS ', { continued: true })
    .font('Helvetica')
    .fillColor('#1a1a1a')
    .text('https://r.uber.com/rkrbssfqjfs', {
        link: 'https://r.uber.com/rkrbssfqjfs',
        underline: true
    });

    uberY += voucherHeight + 8;

    const uberDetailsText = '• Reciba $10 de descuento en cada viaje de Uber (ida y vuelta) a cualquier centro (Hub) designado durante los horarios de encuesta usando el código. Más detalles en youthcount.org/uber.';
    doc.fontSize(11.5).font('Helvetica').fillColor('#1a1a1a');
    const detailsHeight = doc.heightOfString(uberDetailsText, { width: contentWidth - 24 });
    
    doc.text(uberDetailsText, margin + 12, uberY, {
        width: contentWidth - 24,
        align: 'left'
    });

    currentY = uberBoxY + uberBoxHeight + 12;

    // Footer
    doc.moveTo(margin, currentY)
        .lineTo(pageWidth - margin, currentY)
        .lineWidth(2)
        .stroke('#dddddd');

    currentY += 10;

    doc.fontSize(11.5)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text('Los datos se utilizarán para informar al Departamento de Vivienda y Desarrollo Urbano (HUD). Más info en ', margin, currentY, {
            width: contentWidth,
            align: 'left',
            continued: true
        })
        .fillColor('#1a1a1a')
        .text('youthcount.org', {
            link: 'https://youthcount.org',
            underline: true
        });
}

async function generatePDF(seeds: any[], locationName: string, templateKey: string = 'metro'): Promise<void> {
    const outputDir = createOutputDirectory();
    const filepath = generateTimestampFilename(locationName, outputDir);

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
            templateKey,
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
    const Location = (await import('../server/src/database/location/mongoose/location.model.js')).default;
    const Seed = (await import('../server/src/database/seed/mongoose/seed.model.js')).default;
    const { generateUniqueSurveyCode } = await import('../server/src/database/survey/survey.controller.js');
    const connectDB = (await import('../server/src/database/index.js')).default;

    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Connected to database ✓\n');

        const location = await findLocationByIdentifier(locationIdentifier, Location);
        const createdSeeds = await generateSeedsForLocation(location, count, Seed, generateUniqueSurveyCode, templateKey || 'metro');

        printSeedsSummary(createdSeeds, location.hubName);

        console.log('\n📄 Generating PDF with QR codes (LA Youth Count format)...');
        await generatePDF(createdSeeds, location.hubName, templateKey);
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
    console.error('Default template: metro');
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
