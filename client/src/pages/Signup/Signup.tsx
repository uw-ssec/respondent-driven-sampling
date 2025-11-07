import { useEffect, useState } from 'react';

import { saveAuthToken } from '@/utils/authTokenHandler';
import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
	FormInput,
	LocationSelect,
	PhoneInput,
	RoleSelect
} from '@/components/forms';

export default function Signup() {
	const navigate = useNavigate();
	const [userData, setUserData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		role: '',
		locationObjectId: ''
	});
	const [otp, setOtp] = useState('');
	const [otpSent, setOtpSent] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [countdown, setCountdown] = useState(0);

	useEffect(() => {
		let timer: string | number | NodeJS.Timeout | undefined;
		if (otpSent && countdown > 0) {
			timer = setTimeout(() => setCountdown(c => c - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [otpSent, countdown]);

	const handleChange = (e: { target: { name: any; value: any } }) => {
		setUserData({ ...userData, [e.target.name]: e.target.value });
	};

	const handlePhoneChange = (e: { target: { value: string } }) => {
		let input = e.target.value.replace(/\D/g, '');
		if (input.length > 0 && input[0] === '1') {
			input = input.substring(1);
		}
		input = input.slice(0, 10);
		const formatted = input.length > 0 ? `+1${input}` : '';
		setUserData({ ...userData, phone: formatted });
	};

	const sendOtp = async () => {
		setErrorMessage('');
		try {
			const response = await fetch('/api/auth/send-otp-signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone: userData.phone,
					email: userData.email
				})
			});
			const data = await response.json();
			if (response.ok) {
				setOtpSent(true);
				setCountdown(60);
			} else {
				setErrorMessage(data.message);
			}
		} catch {
			setErrorMessage('Failed to send OTP');
		}
	};

	const verifyOtp = async () => {
		try {
			const response = await fetch('/api/auth/verify-otp-signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...userData, code: otp })
			});
			const data = await response.json();
			if (response.ok) {
				saveAuthToken(data.token);
				navigate(data.redirectTo);
			} else {
				setErrorMessage(data.message);
			}
		} catch {
			setErrorMessage('Failed to verify OTP');
		}
	};

	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#f5f5f5',
				py: 4
			}}
		>
			<Box
				sx={{
					maxWidth: 500,
					width: '100%',
					mx: 2,
					p: 4,
					backgroundColor: 'white',
					borderRadius: 2,
					boxShadow: 3
				}}
			>
				<Typography
					variant="h4"
					component="h2"
					gutterBottom
					textAlign="center"
					sx={{ mb: 3 }}
				>
					{otpSent ? 'Verify OTP' : 'Welcome! Sign Up Here!'}
				</Typography>

				{!otpSent ? (
					<Stack spacing={2.5}>
						<Box sx={{ display: 'flex', gap: 2 }}>
							<FormInput
								name="firstName"
								label="First Name"
								value={userData.firstName}
								onChange={handleChange}
								required
							/>
							<FormInput
								name="lastName"
								label="Last Name"
								value={userData.lastName}
								onChange={handleChange}
								required
							/>
						</Box>

						<FormInput
							name="email"
							label="Email"
							type="email"
							value={userData.email}
							onChange={handleChange}
							required
						/>

						<PhoneInput
							name="phone"
							label="Phone Number"
							value={userData.phone}
							onChange={handlePhoneChange}
							required
						/>

						<LocationSelect
							name="locationObjectId"
							value={userData.locationObjectId}
							onChange={handleChange}
							required
						/>

						<RoleSelect
							name="role"
							value={userData.role}
							onChange={handleChange}
							required
						/>

						<Button
							variant="contained"
							size="large"
							fullWidth
							onClick={sendOtp}
							sx={{ mt: 2 }}
						>
							Send OTP
						</Button>

						<Typography variant="body2" textAlign="center">
							Already have an account?{' '}
							<Link
								component="button"
								variant="body2"
								onClick={() => navigate('/login')}
								sx={{ cursor: 'pointer' }}
							>
								Login
							</Link>
						</Typography>
					</Stack>
				) : (
					<Stack spacing={2.5}>
						<FormInput
							label="Enter OTP"
							value={otp}
							onChange={e => setOtp(e.target.value)}
							required
						/>

						<Button
							variant="contained"
							size="large"
							fullWidth
							onClick={verifyOtp}
						>
							Verify OTP & Complete Signup
						</Button>

						<Box textAlign="center">
							{countdown > 0 ? (
								<Typography
									variant="body2"
									color="text.secondary"
								>
									Resend OTP in {countdown}s
								</Typography>
							) : (
								<Button variant="text" onClick={sendOtp}>
									Resend OTP
								</Button>
							)}
						</Box>

						<Typography variant="body2" textAlign="center">
							<Link
								component="button"
								variant="body2"
								onClick={() => {
									setOtpSent(false);
									setOtp('');
									setCountdown(0);
									setErrorMessage('');
								}}
								sx={{ cursor: 'pointer' }}
							>
								Go back to Signup
							</Link>
						</Typography>
					</Stack>
				)}

				{errorMessage && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{errorMessage}
					</Alert>
				)}
			</Box>
		</Box>
	);
}
