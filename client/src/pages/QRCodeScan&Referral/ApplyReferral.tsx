import { useEffect, useRef, useState } from 'react';

import { Html5QrcodeScanner } from 'html5-qrcode'; // Import QR scanner
import { useNavigate } from 'react-router-dom';

import Header from '@/pages/Header/Header';

import '@/styles/ApplyReferral.css';

import { LogoutProps } from '@/types/AuthProps';
import { getToken } from '@/utils/tokenHandling';

export default function ApplyReferral({ onLogout }: LogoutProps) {
	const navigate = useNavigate();
	const [referralCode, setReferralCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [isScanning, setIsScanning] = useState(false); // Track scanning state
	const scannerRef = useRef<Html5QrcodeScanner | null>(null);
	const readerRef = useRef<HTMLDivElement | null>(null);

	// Effect to initialize the QR scanner
	// This effect runs when the component mounts and when isScanning changes
	useEffect(() => {
		if (isScanning && readerRef.current) {
			const config = { fps: 10, qrbox: 250 };
			const verbose = false;
			scannerRef.current = new Html5QrcodeScanner(
				'qr-reader',
				config,
				verbose
			);

			scannerRef.current.render(onScanSuccess, onScanFailure);
		}

		// Cleanup function to stop the scanner when the component unmounts or scanning stops
		return () => {
			if (scannerRef.current) {
				scannerRef.current
					.clear()
					.catch(err =>
						console.warn('Failed to clear QR scanner:', err)
					);
			}
		};
	}, [isScanning]);

	// Function to handle logout
	const onScanSuccess = (decodedText: string) => {
		if (scannerRef.current) {
			scannerRef.current
				.clear()
				.then(() =>
					console.log('Scanner stopped after successful scan')
				)
				.catch(error =>
					console.error('Failed to stop scanner:', error)
				);
		}
		setIsScanning(false);

		// Check if the scanned text is a valid URL
		try {
			const url = new URL(decodedText);
			window.location.href = url.href; // Redirect user to the scanned URL
		} catch (error) {
			alert('Invalid QR Code. Please scan a valid link.');
		}
	};

	// Function to handle QR code scan failure
	const onScanFailure = (error: string) => {
		console.warn(`QR Code scan error: ${error}`);
	};

	// Function to handle referral code submission
	const handleStartSurvey = async () => {
		if (!referralCode.trim()) {
			alert('Please enter a referral code.');
			return;
		}

		setLoading(true);

		try {
			const token = getToken();
			const response = await fetch(
				`/api/surveys/validate-ref/${referralCode}`, {
					headers: { 'Authorization': `Bearer ${token}` }
				}
			);
			const data = await response.json();

			if (response.ok) {
				navigate('/survey', { state: { referralCode } });
			} else if (response.status == 401) {
				// Token Error, either expired or invalid for some other reason.
				// Log user out so they can relogin to generate a new valid token
				onLogout();
				navigate('/login');
				return;
			} else {
				alert(
					data.message ||
						'Invalid or already used referral code. Please try again.'
				);
				setLoading(false);
				return;
			}
		} catch (error) {
			console.error('Error validating referral code:', error);
			alert('Server error. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	// Function to handle cancel button click
	return (
		<div className="apply-referral-page">
			<Header onLogout={onLogout} />
			<div className="apply-referral-container">
				<h2>Apply Referral Code</h2>
				<p>Enter or scan a QR code to start a new survey.</p>

				<input
					type="text"
					placeholder="Enter referral code..."
					value={referralCode}
					onChange={e =>
						setReferralCode(e.target.value.toUpperCase())
					}
					className="referral-input"
				/>

				{/* Start Survey Button */}
				<button
					className="generate-btn"
					onClick={handleStartSurvey}
					disabled={loading}
				>
					{loading ? 'Checking...' : 'Start Survey with Referral'}
				</button>

				{/* QR Code Scanner Button */}
				<button
					className="generate-btn"
					onClick={() => setIsScanning(!isScanning)}
					disabled={loading}
				>
					{isScanning ? 'Stop Scanning' : 'Scan QR Code with Camera'}
				</button>

				<div
					onClick={() => navigate('/survey')}
					className="new-seed-btn"
				>
					No referral code? Start new seed
				</div>

				{/* QR Code Scanner Container (Only shows when scanning) */}
				{isScanning && (
					<div
						ref={readerRef}
						id="qr-reader"
						style={{ width: '300px', margin: '10px auto' }}
					></div>
				)}

				{/* Cancel Button */}
				<button
					className="generate-btn cancel-btn"
					onClick={() => navigate('/dashboard')}
					disabled={loading}
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
