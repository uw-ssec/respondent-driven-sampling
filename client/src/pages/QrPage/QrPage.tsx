import { useRef } from 'react';

import { useSurveyStore } from '@/stores';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

import '@/styles/complete.css';

import { printQrCodePdf } from '@/utils/qrCodeUtils';

// Description: Displays referral QR codes and allows them to be printing

export default function QrPage() {
	const navigate = useNavigate();
	const { surveyData } = useSurveyStore();
	const childSurveyCodes = surveyData?.childSurveyCodes || [];
	const qrRefs = useRef<(HTMLDivElement | null)[]>([]);

	// Print PDF with custom paper size (62mm width)
	const handlePrint = () => {
		printQrCodePdf(qrRefs.current, childSurveyCodes);
	};

	return (
		<div className="completed-survey-page">
			<div className="completed-survey-container">
				<h2>Referral QR Codes</h2>
				<p>Provide these QR codes to referred individuals.</p>

				{/* Display QR Codes */}
				<div className="print-area">
					<div className="qr-code-container">
						{childSurveyCodes.length > 0 ? (
							childSurveyCodes.map(
								(code: string, index: number) => {
									const qrSurveyCode = code;
									return (
										<div
											key={index}
											className="qr-box"
											ref={el => {
												qrRefs.current[index] = el;
											}}
										>
											<QRCodeCanvas
												value={qrSurveyCode}
												size={120}
												level="M"
											/>
											<p className="qr-code-text">
												{index + 1}. Referral Code:{' '}
												{code}
											</p>
										</div>
									);
								}
							)
						) : (
							<p>No referral codes available.</p>
						)}
					</div>
				</div>

				<div className="qr-buttons">
					<button className="generate-btn" onClick={handlePrint}>
						Print QR Codes
					</button>
					<button
						className="generate-btn"
						onClick={() => navigate('/dashboard')}
					>
						Complete Surveying Process
					</button>
				</div>
			</div>
		</div>
	);
}
