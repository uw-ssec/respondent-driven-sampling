#!/usr/bin/env tsx
/**
 * Script to generate a blank PDF template for survey referral coupons.
 * This script does not connect to the database or generate real seeds.
 * It creates a single-page PDF with a placeholder for a QR code.
 *
 * Usage:
 * 1. Make sure you are in the `server` directory.
 * 2. Run: npm run generate-coupons -- [how-many]
 *    Example: npm run generate-coupons -- 10  (generates a PDF with 10 coupons)
 *    Example: npm run generate-coupons      (generates a PDF with 1 coupon)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Create require from server directory to access server's node_modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRequire = createRequire(path.join(__dirname, '../server/package.json'));

// Dynamically require dependencies from the server's context
const PDFDocument = serverRequire('pdfkit');
const logoPath = path.join(__dirname, 'assets/logo.png');

// ===== PDF Generation Helper Functions =====

function createOutputDirectory(): string {
    const outputDir = path.join(__dirname, 'coupons');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
}

function generateTimestampFilename(outputDir: string, count: number): string {
    const now = new Date();
    const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('');
    const filename = `coupons-${count}-${timestamp}.pdf`;
    return path.join(outputDir, filename);
}

function addTemplatePage(doc: any): void {
    const pageWidth = doc.page.width;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    let currentY = margin;

    // Logo
    if (fs.existsSync(logoPath)) {
        const logoWidth = 60;
        doc.image(logoPath, (pageWidth - logoWidth) / 2, currentY, {
            fit: [logoWidth, logoWidth]
        });
        currentY += logoWidth + 10;
    }

    // Title
    doc.fontSize(18)
        .font('Helvetica-Bold')
        .text('Understanding Unsheltered Homelessness', margin, currentY, {
            align: 'center',
            width: contentWidth
        });

    currentY += 40;

    // Instructions
    doc.fontSize(12)
        .font('Helvetica')
        .text(
            'Bring this coupon to one of the locations below to complete a survey about your experience being unsheltered (including living in an RV or car/vehicle) and to receive a ',
            margin,
            currentY,
            {
                align: 'left',
                width: contentWidth,
                continued: true
            }
        )
        .font('Helvetica-Bold')
        .text('$20', { continued: true })
        .font('Helvetica')
        .text(' Gift Card.');

    currentY += 50;

    doc.fontSize(12)
        .font('Helvetica')
        .text(
            'Our locations are accessible with free parking and bike racks unless marked otherwise.',
            margin,
            currentY,
            {
                align: 'left',
                width: contentWidth
            }
        );

    currentY += 25;

    doc.text('Pets and service animals welcome.', margin, currentY, {
        align: 'left',
        width: contentWidth
    });

    currentY += 50;

    // --- QR Code Placeholder ---
    const qrSize = 150;
    const qrX = (pageWidth - qrSize) / 2;

    doc.lineWidth(1)
        .rect(qrX, currentY, qrSize, qrSize)
        .dash(5, { space: 5 })
        .stroke();

    doc.fontSize(10)
        .font('Helvetica-Oblique')
        .text('Place QR Code Sticker Here', qrX, currentY + qrSize / 2 - 5, {
            width: qrSize,
            align: 'center'
        });

    currentY += qrSize + 15;

    // Locations section
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('Locations', margin, currentY, {
            align: 'left',
            width: contentWidth
        });

    currentY += 20;

    doc.fontSize(11)
        .font('Helvetica')
        .text('• Highline United Methodist Church', margin + 10, currentY, {
            align: 'left',
            width: contentWidth - 10
        });

    currentY += 15;

    doc.text('  13015 1st AVE S, Burien, WA 98168', margin + 10, currentY, {
        align: 'left',
        width: contentWidth - 10
    });

    currentY += 20;

    doc.text('• Interview Dates and Hours:', margin + 10, currentY, {
        align: 'left',
        width: contentWidth - 10
    });

    currentY += 15;

    doc.text('  Monday - Friday (11/17 - 11/21)', margin + 10, currentY, {
        align: 'left',
        width: contentWidth - 10
    });

    currentY += 15;

    doc.text('  10am to 3pm', margin + 10, currentY, {
        align: 'left',
        width: contentWidth - 10
    });

    currentY += 50;

    // Contact info
    doc.fontSize(10)
        .font('Helvetica')
        .text('For questions, please call +1 (833) 393-1621', margin, currentY, {
            align: 'center',
            width: contentWidth
        });
}

async function generateCoupons(): Promise<void> {
    try {
        const args = process.argv.slice(2);
        const count = args.length > 0 ? parseInt(args[0], 10) : 1;

        if (isNaN(count) || count < 1) {
            throw new Error('Invalid number provided. Please provide a positive integer for the number of coupons.');
        }

        console.log(`📄 Generating a PDF with ${count} blank coupon(s)...`);

        const outputDir = createOutputDirectory();
        const filepath = generateTimestampFilename(outputDir, count);

        const doc = new PDFDocument({
            size: 'LETTER',
            margin: 50,
            autoFirstPage: false // We will add pages manually
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        for (let i = 0; i < count; i++) {
            doc.addPage();
            addTemplatePage(doc);
        }

        doc.end();

        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`\n✓ PDF generated: ${filepath}`);
    } catch (error) {
        console.error('\n✗ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

// Run the script
generateCoupons();
