import { useCallback, useEffect, useRef, useState } from 'react';

import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

import '@/styles/ApplyReferral.css';

import { SURVEY_CODE_LENGTH } from '@/constants';
import { useAbility, useApi } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { useSurveyStore } from '@/stores';
import { Alert, TextField } from '@mui/material';
import toast from 'react-hot-toast';

export default function ApplyReferral() {
	const ability = useAbility();
	const navigate = useNavigate();
	const { surveyService } = useApi();
	const [referralCode, setReferralCode] = useState('');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const { clearSurvey } = useSurveyStore();
	const [isScanning, setIsScanning] = useState(false); // Track scanning state
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const readerRef = useRef<HTMLDivElement | null>(null);

	// Function to handle successful QR code scan
	const onScanSuccess = useCallback(async (decodedText: string) => {
		if (scannerRef.current) {
			scannerRef.current
				.stop()
				.then(() => {
					scannerRef.current?.clear();
				})
				.catch(error =>
					console.error('Failed to stop scanner:', error)
				);
		}
		setIsScanning(false);

		// Extract coupon code from scanned text
		const code = decodedText.trim();

		if (!code) {
			toast.error('Invalid QR Code. Could not extract coupon code.');
			return;
		}

		// Clear any existing survey data and navigate to survey with the coupon code
		clearSurvey();
		try {
			const data = await surveyService.fetchReferralCodeValidation(code);

			if (!data?.isValid) {
				setErrorMessage(data?.message ?? 'Invalid coupon code.');
				setLoading(false);
				return;
			}

			// If valid, navigate to the survey page with the coupon code
			navigate(`/survey?ref=${code}`);
		} catch (error) {
			console.error('Error validating coupon code:', error);
			setErrorMessage(
				error instanceof Error
					? error.message
					: 'An unexpected error occurred. Please try again.'
			);
			setLoading(false);
		}
	}, []);

	// Function to handle QR code scan failure
	const onScanFailure = useCallback((error: string) => {
		console.warn(`QR Code scan error: ${error}`);
	}, []);

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
					{ facingMode: 'environment' },
					config,
					onScanSuccess,
					onScanFailure
				)
				.catch(err => {
					console.error('Failed to start scanning:', err);
					toast.error(
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
	}, [isScanning, onScanSuccess, onScanFailure]);

	// Function to handle coupon code submission
	const handleStartSurvey = async () => {
		if (!referralCode.trim()) {
			setErrorMessage('Please enter a coupon code.');
			return;
		}

		if (referralCode.length !== SURVEY_CODE_LENGTH) {
			setErrorMessage(
				`Please enter a valid ${SURVEY_CODE_LENGTH}-character coupon code.`
			);
			return;
		}

		setLoading(true);

		// Clear any existing survey data from previous attempts
		clearSurvey();

		try {
			const data =
				await surveyService.fetchReferralCodeValidation(referralCode);

			if (!data?.isValid) {
				setErrorMessage(data?.message ?? 'Invalid coupon code.');
				setLoading(false);
				return;
			}

			// If valid, navigate to the survey page with the coupon code
			navigate(`/survey?ref=${referralCode}`);
		} catch (error) {
			console.error('Error validating coupon code:', error);
			setErrorMessage(
				error instanceof Error
					? error.message
					: 'An unexpected error occurred. Please try again.'
			);
			setLoading(false);
		}
	};

	// Function to handle cancel button click
	return (
		<div className="apply-referral-page">
			<div className="apply-referral-container">
				<h2>Start a New Survey</h2>
				<p>Enter or Scan a QR code to start a new survey.</p>

				{/* <input
					type="text"
					placeholder="Enter coupon code..."
					value={referralCode}
					onChange={e =>
						setReferralCode(e.target.value.toUpperCase())
					}
					className="referral-input"
				/> */}
				<TextField
					type="text"
					label="Coupon code"
					placeholder="Enter coupon code..."
					value={referralCode}
					onChange={e =>
						setReferralCode(e.target.value.toUpperCase())
					}
					fullWidth
					variant="outlined"
					sx={{ mb: 2 }}
				/>

				{/* Start Survey Button */}
				<button
					className="generate-btn"
					onClick={handleStartSurvey}
					disabled={loading}
				>
					{loading ? 'Checking...' : 'Enter the Coupon Code'}
				</button>

				{/* QR Code Scanner Button */}
				<button
					className="generate-btn"
					onClick={() => setIsScanning(!isScanning)}
					disabled={loading}
				>
					{isScanning ? 'Stop Scanning' : 'Scan QR Code with Camera'}
				</button>

				{ability.can(
					ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL,
					SUBJECTS.SURVEY
				) && (
					<div
						onClick={() => {
							navigate('/survey');
							clearSurvey();
						}}
						className="new-seed-btn"
					>
						No coupon code? Start new survey
					</div>
				)}

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
				{errorMessage && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{errorMessage}
					</Alert>
				)}
			</div>
		</div>
	);
}
