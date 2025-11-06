import { useSurveyStore } from '@/stores';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';

import '@/styles/complete.css';

// Description: Displays referral QR codes and allows them to be printing

export default function QrPage() {
	const navigate = useNavigate();
	const { surveyData } = useSurveyStore();
	const childSurveyCodes = surveyData?.childSurveyCodes || [];

	// Trigger browser printing
	const handlePrint = () => {
		window.print();
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
									const qrUrl = `${window.location.origin}/survey?ref=${code}`;
									return (
										<div key={index} className="qr-box">
											<QRCodeCanvas
												value={qrUrl}
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
