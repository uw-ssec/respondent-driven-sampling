import { useEffect, useRef, useState } from 'react';

import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

import Header from '@/pages/Header/Header';

import '@/styles/ApplyReferral.css';

import { getAuthToken } from '@/utils/authTokenHandler';

import { useSurveyStore } from '@/stores/useSurveyStore';

import { LogoutProps } from '@/types/AuthProps';

export default function ApplyReferral({ onLogout }: LogoutProps) {
	const navigate = useNavigate();
	const [referralCode, setReferralCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [isScanning, setIsScanning] = useState(false); // Track scanning state
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const readerRef = useRef<HTMLDivElement | null>(null);
	const { clearSurvey, setObjectId } = useSurveyStore();

	// Effect to initialize the QR scanner
	// This effect runs when the component mounts and when isScanning changes
	// Defaults to back camera unless there is no back camera
	useEffect(() => {
		if (isScanning && readerRef.current) {
			const html5QrCode = new Html5Qrcode('qr-reader');
			scannerRef.current = html5QrCode;

			const config = { fps: 10, qrbox: { width: 250, height: 250 } };

			html5QrCode
				.start(
					{ facingMode: 'environment' }, // If you want to prefer back camera
					config,
					onScanSuccess,
					onScanFailure
				)
				.catch(err => {
					console.error('Failed to start scanning:', err);
					alert(
						'We could not access the camera. Make sure camera permissions are granted.'
					);
					setIsScanning(false);
				});
		}

		// Cleanup function to stop the scanner when the component unmounts or scanning stops
		return () => {
			if (scannerRef.current) {
				if (scannerRef.current.isScanning) {
					scannerRef.current
						.stop()
						.then(() => scannerRef.current?.clear())
						.catch(err =>
							console.warn(
								'Failed to stop and clear QR scanner:',
								err
							)
						);
				} else {
					try {
						scannerRef.current.clear();
					} catch (err) {
						console.warn('Failed to clear QR scanner:', err);
					}
				}
			}
		};
	}, [isScanning]);

	// Function to handle successful QR code scan
	const onScanSuccess = (decodedText: string) => {
		if (scannerRef.current) {
			scannerRef.current
				.stop()
				.then(() => {
					scannerRef.current?.clear();
					console.log('Scanner stopped after successful scan.');
				})
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
			const token = getAuthToken();
			const response = await fetch(
				`/api/surveys/validate-ref/${referralCode}`,
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);
			const data = await response.json();

			// Before redirecting, clear any previous survey-specific data
			clearSurvey();

			if (response.ok) {
				// Valid with no survey in progress, redirect to survey with initial referral code
				navigate(`/survey?ref=${referralCode}`);
				return;
			} else if (response.status == 401) {
				// Token Error, either expired or invalid for some other reason.
				// Log user out so they can relogin to generate a new valid token
				onLogout();
				navigate('/login');
				return;
			} else {
				// Invalid because we already have a survey in progress, redirect to that survey
				if (data.survey) {
					alert('This survey is already in progress. Please continue.');
					setObjectId(data.survey._id); // Add survey ID to Zustand store
					navigate(`/survey/${data.survey._id}/survey?ref=${data.survey.referredByCode}`);
					return;
				}

				// Otherwise, invalid for some other reason, return error
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
					onClick={() => {clearSurvey(); navigate('/survey')}} // Clear any previous survey data before generating new survey
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
