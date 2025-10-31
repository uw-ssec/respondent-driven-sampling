import { useEffect, useRef, useState } from 'react';

import {
	Box,
	Button,
	Container,
	Paper,
	TextField,
	Typography
} from '@mui/material';
import { CameraAlt, QrCodeScanner } from '@mui/icons-material';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

import Header from '@/pages/Header/Header';

import { LogoutProps } from '@/types/AuthProps';
import { useSurveyStore } from '@/stores/useSurveyStore';

export default function ApplyReferral({ onLogout }: LogoutProps) {
	const navigate = useNavigate();
	const [referralCode, setReferralCode] = useState('');
	const [loading, setLoading] = useState(false);
	const { clearSurvey } = useSurveyStore();
	const [isScanning, setIsScanning] = useState(false); // Track scanning state
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const readerRef = useRef<HTMLDivElement | null>(null);

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

		// Clear any existing survey data from previous attempts
		clearSurvey();

		navigate(`/survey?ref=${referralCode}`);
	};

	return (
		<Box>
			<Header onLogout={onLogout} />
			<Container
				maxWidth="md"
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: 'calc(100vh - 80px)',
					py: 4
				}}
			>
				<Paper
					elevation={3}
					sx={{
						p: 4,
						maxWidth: 600,
						width: '100%',
						textAlign: 'center',
						borderRadius: 2
					}}
				>
					<Typography
						variant="h4"
						component="h2"
						color="primary.main"
						sx={{ mb: 2, fontWeight: 600 }}
					>
						Apply Referral Code
					</Typography>
					
					<Typography
						variant="body1"
						color="text.secondary"
						sx={{ mb: 4 }}
					>
						Enter or scan a QR code to start a new survey.
					</Typography>

					<TextField
						fullWidth
						variant="outlined"
						placeholder="Enter referral code..."
						value={referralCode}
						onChange={e =>
							setReferralCode(e.target.value.toUpperCase())
						}
						sx={{ mb: 3 }}
						inputProps={{
							style: { textTransform: 'uppercase' }
						}}
					/>

					{/* Start Survey Button */}
					<Button
						variant="contained"
						size="large"
						fullWidth
						onClick={handleStartSurvey}
						disabled={loading}
						sx={{ mb: 2, py: 1.5 }}
					>
						{loading ? 'Checking...' : 'Start Survey with Referral'}
					</Button>

					{/* QR Code Scanner Button */}
					<Button
						variant="outlined"
						size="large"
						fullWidth
						onClick={() => setIsScanning(!isScanning)}
						disabled={loading}
						startIcon={isScanning ? <CameraAlt /> : <QrCodeScanner />}
						sx={{ mb: 2, py: 1.5 }}
					>
						{isScanning ? 'Stop Scanning' : 'Scan QR Code with Camera'}
					</Button>

					<Button
						variant="text"
						size="large"
						fullWidth
						onClick={() => {navigate('/survey'); clearSurvey()}}
						sx={{ 
							mb: 3, 
							py: 1.5,
							textDecoration: 'underline',
							'&:hover': {
								textDecoration: 'none'
							}
						}}
					>
						No referral code? Start new seed
					</Button>

					{/* QR Code Scanner Container (Only shows when scanning) */}
					{isScanning && (
						<Box
							ref={readerRef}
							id="qr-reader"
							sx={{
								width: 300,
								mx: 'auto',
								my: 2,
								border: '2px solid',
								borderColor: 'primary.main',
								borderRadius: 2,
								overflow: 'hidden'
							}}
						/>
					)}

					{/* Cancel Button */}
					<Button
						variant="outlined"
						color="secondary"
						size="large"
						fullWidth
						onClick={() => navigate('/dashboard')}
						disabled={loading}
						sx={{ py: 1.5 }}
					>
						Cancel
					</Button>
				</Paper>
			</Container>
		</Box>
	);
}
