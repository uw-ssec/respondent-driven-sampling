import jsPDF from 'jspdf';

// Helper function to create a PDF with QR codes
const createQrCodePdf = (
	qrRefs: (HTMLDivElement | null)[],
	codes: string[]
): jsPDF => {
	// Convert mm to points
	const pageWidthMm = 62;
	const pageWidthPt = pageWidthMm * 2.83465;
	const marginMm = 4;
	const marginPt = marginMm * 2.83465;
	const contentWidthPt = pageWidthPt - 2 * marginPt;

	// Calculate QR code size to fit within content width
	const qrSizePt = Math.min(contentWidthPt * 0.9, 300); // Max 300pt or 90% of content width
	const textHeightPt = 15;
	const spacingPt = 20;

	// Calculate required page height for each QR code
	const pageHeightPt =
		marginPt + spacingPt + qrSizePt + spacingPt + textHeightPt + marginPt;

	// Build all pages in a single PDF
	const pdf = new jsPDF({
		orientation: 'portrait',
		unit: 'pt',
		format: [pageWidthPt, pageHeightPt]
	});

	for (let i = 0; i < codes.length; i++) {
		if (i > 0) {
			pdf.addPage([pageWidthPt, pageHeightPt]);
		}

		const qrBox = qrRefs[i];
		if (!qrBox) continue;

		const canvas = qrBox.querySelector('canvas') as HTMLCanvasElement;
		if (!canvas) continue;

		// Convert canvas to image
		const imgData = canvas.toDataURL('image/png');

		// Calculate X position to center QR code
		const qrX = marginPt + (contentWidthPt - qrSizePt) / 2;
		const qrY = marginPt + spacingPt;

		// Add QR code image
		pdf.addImage(imgData, 'PNG', qrX, qrY, qrSizePt, qrSizePt);

		// Add referral code text
		const code = codes[i];
		pdf.setFontSize(10);
		pdf.text(
			`Referral Code: ${code}`,
			pageWidthPt / 2,
			qrY + qrSizePt + spacingPt,
			{
				align: 'center'
			}
		);
	}

	return pdf;
};

export const printQrCodePdf = (
	qrRefs: (HTMLDivElement | null)[],
	codes: string[]
): void => {
	if (codes.length === 0) {
		return;
	}

	const pdf = createQrCodePdf(qrRefs, codes);
	const pdfBlob = pdf.output('blob');
	const blobUrl = URL.createObjectURL(pdfBlob);

	// Open PDF in a new window
	const printWindow = window.open(blobUrl, '_blank');

	if (printWindow) {
		// Retry framework for slow PDF loads
		const maxRetries = 5;
		let retryCount = 0;
		let printAttempted = false;

		const attemptPrint = () => {
			// Check if window is still open and accessible
			if (printWindow.closed) {
				URL.revokeObjectURL(blobUrl);
				return;
			}

			try {
				// Try to trigger print
				printWindow.print();
				printAttempted = true;

				// Clean up blob URL after print dialog is shown
				setTimeout(() => {
					URL.revokeObjectURL(blobUrl);
				}, 1000);
			} catch (error) {
				// If print fails, retry if we haven't exceeded max retries
				retryCount++;

				if (retryCount < maxRetries) {
					// Exponential backoff
					const delay = Math.min(500 * retryCount, 4000);
					setTimeout(attemptPrint, delay);
				} else {
					// Max retries exceeded - user can manually print from the opened window
					console.warn(
						'Auto-print failed after multiple attempts. User can print manually from the opened window.'
					);
					// Clean up blob URL after a delay
					setTimeout(() => {
						URL.revokeObjectURL(blobUrl);
					}, 2000);
				}
			}
		};

		// Initial attempt after a short delay
		setTimeout(attemptPrint, 500);

		// Also listen for window load event as a backup trigger
		printWindow.addEventListener(
			'load',
			() => {
				if (!printAttempted) {
					setTimeout(attemptPrint, 100);
				}
			},
			{ once: true }
		);
	} else {
		// Popup blocked - fallback: create download link
		const link = document.createElement('a');
		link.href = blobUrl;
		link.download = 'referral-qr-codes.pdf';
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		// Clean up after a short delay
		setTimeout(() => {
			document.body.removeChild(link);
			URL.revokeObjectURL(blobUrl);
		}, 1000);
	}
};
