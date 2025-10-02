import { useEffect, useState } from 'react';

import Header from '@/pages/Header/Header';
import { useSurveyStore } from '@/stores/useSurveyStore';
import { QRCodeCanvas } from 'qrcode.react';
import { useLocation, useNavigate } from 'react-router-dom';

import { LogoutProps } from '@/types/AuthProps';

import '@/styles/complete.css';

// Description: Displays referral QR codes and allows them to be printing

export default function QrPage({ onLogout }: LogoutProps) {
	const navigate = useNavigate();
	const location = useLocation();
	const [referralCodes, setReferralCodes] = useState([]);

	// Clear referred-by-code from Zustand store now that we are done with the survey
	const { setReferredByCode } = useSurveyStore();
	useEffect(() => {
		setReferredByCode(null);
	}, [setReferredByCode]);

	// Extract referral codes
	useEffect(() => {
		if (location.state?.referralCodes) {
			setReferralCodes(location.state.referralCodes);
		}
	}, [location.state]);

	// Trigger browser printing
	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="completed-survey-page">
			<Header onLogout={onLogout} />

			<div className="completed-survey-container">
				<h2>Referral QR Codes</h2>
				<p>Provide these QR codes to referred individuals.</p>

				{/* Display QR Codes */}
				<div className="print-area">
					<div className="qr-code-container">
						{referralCodes.length > 0 ? (
							referralCodes.map((code, index) => {
								const qrUrl = `${window.location.origin}/survey?ref=${code}`;
								return (
									<div key={index} className="qr-box">
										<QRCodeCanvas
											value={qrUrl}
											size={120}
											level="M"
										/>
										<p className="qr-code-text">
											{index + 1}. Referral Code: {code}
										</p>
									</div>
								);
							})
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
