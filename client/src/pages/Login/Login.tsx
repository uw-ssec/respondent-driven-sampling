import { useEffect, useState } from 'react';

import { useSurveyStore } from '@/stores';
import { deleteAuthToken, isTokenValid } from '@/utils/authTokenHandler';
import {
	Alert,
	Box,
	Button,
	Paper,
	TextField,
	Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

export default function Login() {
	const { handleLogin } = useAuth();
	const navigate = useNavigate();
	const { clearSession } = useSurveyStore();

	// Redirect if user already has a valid token
	useEffect(() => {
		if (isTokenValid()) {
			navigate('/dashboard');
		} else {
			// Token is invalid or expired, clean it up
			deleteAuthToken();
		}
	}, [navigate]);
	// const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [otp, setOtp] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [countdown, setCountdown] = useState(0);

	// countdown timer
	useEffect(() => {
		let timer: string | number | NodeJS.Timeout | undefined;
		if (otpSent && countdown > 0) {
			timer = setTimeout(() => setCountdown(c => c - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [otpSent, countdown]);

	// enforce +1 prefix, strip any non-digits, max 10 user digits
	const handlePhoneChange = (e: { target: { value: string } }) => {
		let input = e.target.value.replace(/\D/g, '');
		// if user really types a leading 1, drop it
		if (input.length > 0 && input[0] === '1') {
			input = input.substring(1);
		}
		// trim to 10
		input = input.slice(0, 10);
		const formatted = input.length > 0 ? `+1${input}` : '';
		setPhone(formatted);
	};

	// Sends OTP to phone
	const sendOtp = async () => {
		// basic client‑side check
		if (phone.length !== 12) {
			setErrorMessage('Enter a valid 10‑digit phone number');
			setSuccessMessage('');
			return;
		}
		try {
			const response = await fetch('/api/auth/send-otp-login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone })
			});
			const data = await response.json();
			if (response.ok) {
				setOtpSent(true);
				setCountdown(60);
				setErrorMessage('');
				setSuccessMessage(
					'OTP sent successfully! Please check your phone.'
				);
			} else {
				setErrorMessage(data.message);
				setSuccessMessage('');
			}
		} catch {
			setErrorMessage('Failed to send OTP! Please try again.');
			setSuccessMessage('');
		}
	};

	// Verifies entered OTP matches with the backend database
	const verifyOtp = async () => {
		try {
			const response = await fetch('/api/auth/verify-otp-login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone, code: otp })
			});
			const data = await response.json();
			if (response.ok) {
				// Successful login and store user data
				await handleLogin(data.token);
				clearSession(); // Clear any previous survey data from storage
				navigate(data.redirectTo);
			} else {
				setErrorMessage(data.message);
				setSuccessMessage('');
			}
		} catch {
			setErrorMessage('Failed to verify OTP');
			setSuccessMessage('');
		}
	};

	const handleSendOtpKeyDown = (e: { key: string }) => {
		if (e.key === 'Enter') {
			sendOtp();
		}
	};

	const handleVerifyOtpKeyDown = (e: { key: string }) => {
		if (e.key === 'Enter') {
			verifyOtp();
		}
	};

	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				margin: 0,
				background: 'linear-gradient(to bottom right, #f0f2f5, #e0e6ed)'
			}}
		>
			<Paper
				elevation={3}
				sx={{
					p: 6,
					width: '100%',
					maxWidth: 450,
					textAlign: 'center',
					borderRadius: 3
				}}
			>
				<Typography
					variant="h4"
					component="h2"
					color="primary.main"
					sx={{ mb: 3 }}
				>
					{otpSent
						? 'Verify OTP'
						: 'Hi, Welcome to Point-in-Time Count 2026!'}
				</Typography>

				{/* Initial login page */}
				{!otpSent ? (
					<>
						{/* <TextField
							type="email"
							label="Enter Email"
							placeholder="Enter Email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							onKeyDown={handleSendOtpKeyDown}
							required
							fullWidth
							variant="outlined"
							sx={{ mb: 2 }}
						/> */}
						<TextField
							type="text"
							label="Phone Number"
							placeholder="Phone (+1XXXXXXXXXX)"
							value={phone}
							onChange={handlePhoneChange}
							onKeyDown={handleSendOtpKeyDown}
							required
							fullWidth
							variant="outlined"
							sx={{ mb: 2 }}
						/>
						<Button
							onClick={sendOtp}
							variant="contained"
							size="large"
							fullWidth
							sx={{ mb: 2, py: 1.5 }}
						>
							Send OTP &amp; Login
						</Button>
						{/* Button to registration page */}
						<Typography
							variant="body2"
							color="primary.main"
							sx={{ mt: 2 }}
						>
							Do not have an account?{' '}
							<Typography
								component="span"
								onClick={() => navigate('/signup')}
								sx={{
									cursor: 'pointer',
									textDecoration: 'underline',
									fontWeight: 500,
									'&:hover': {
										textDecoration: 'none'
									}
								}}
							>
								Sign Up
							</Typography>
						</Typography>
					</>
				) : (
					<>
						{/* OTP verification page */}
						<TextField
							type="text"
							label="Enter OTP"
							placeholder="Enter OTP"
							value={otp}
							onChange={e => setOtp(e.target.value)}
							onKeyDown={handleVerifyOtpKeyDown}
							required
							fullWidth
							variant="outlined"
							sx={{ mb: 2 }}
						/>
						<Button
							onClick={verifyOtp}
							variant="contained"
							size="large"
							fullWidth
							sx={{ mb: 2, py: 1.5 }}
						>
							Verify OTP &amp; Login
						</Button>
						{/* Resend OTP button or countdown */}
						<Typography
							variant="body2"
							color="primary.main"
							sx={{ mt: 2 }}
						>
							{countdown > 0 ? (
								`Resend OTP in ${countdown}s`
							) : (
								<Button onClick={sendOtp} variant="text">
									Resend OTP
								</Button>
							)}
						</Typography>

						{/* Option to go back to phone entry */}
						<Typography
							variant="body2"
							color="primary.main"
							sx={{ mt: 2 }}
						>
							<Typography
								component="span"
								onClick={() => {
									setOtpSent(false);
									setOtp('');
									setCountdown(0);
									setErrorMessage('');
									setSuccessMessage('');
								}}
								sx={{
									cursor: 'pointer',
									textDecoration: 'underline',
									fontWeight: 500,
									'&:hover': {
										textDecoration: 'none'
									}
								}}
							>
								Go back to Login
							</Typography>
						</Typography>
					</>
				)}

				{errorMessage && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{errorMessage}
					</Alert>
				)}
				{successMessage && (
					<Alert severity="success" sx={{ mt: 2 }}>
						{successMessage}
					</Alert>
				)}
			</Paper>
		</Box>
	);
}
