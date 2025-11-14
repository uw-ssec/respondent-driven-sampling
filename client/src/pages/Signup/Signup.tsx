import { useEffect, useState } from 'react';

import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
	FormInput,
	LocationSelect,
	PhoneInput,
	RoleSelect
} from '@/components/forms';
import {
	deleteAuthToken,
	isTokenValid
} from '@/utils/authTokenHandler';

export default function Signup() {
	const navigate = useNavigate();

	// Redirect if user already has a valid token
	useEffect(() => {
		if (isTokenValid()) {
			navigate('/dashboard');
		} else {
			// Token is invalid or expired, clean it up
			deleteAuthToken();
		}
	}, [navigate]);
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
	const [errorMessages, setErrorMessages] = useState<string[]>([]);
	const [countdown, setCountdown] = useState(0);
	const [pendingApproval, setPendingApproval] = useState(false);
	const [signupSuccess, setSignupSuccess] = useState(false);

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
		setErrorMessages([]);
		try {
			const response = await fetch('/api/auth/send-otp-signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(userData)
			});
			const data = await response.json();
			if (response.ok) {
				setOtpSent(true);
				setCountdown(60);
			} else {
				// Extract individual error messages from validation errors
				if (data.errors && Array.isArray(data.errors)) {
					const messages = data.errors.map((err: { message: string }) => err.message);
					setErrorMessages(messages);
				} else {
					setErrorMessages([data.message || 'Failed to send OTP']);
				}
			}
		} catch {
			setErrorMessages(['Failed to send OTP']);
		}
	};

	const verifyOtp = async () => {
		setErrorMessages([]);
		try {
			const response = await fetch('/api/auth/verify-otp-signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...userData, code: otp })
			});
			const data = await response.json();
			if (response.ok) {
				// New users always need approval, show pending message that instructs user to sign in again once approved
				setSignupSuccess(true);
				setPendingApproval(true);
				setOtpSent(false);
				setOtp('');
			} else {
				// Extract individual error messages from validation errors
				if (data.errors && Array.isArray(data.errors)) {
					const messages = data.errors.map((err: { message: string }) => err.message);
					setErrorMessages(messages);
				} else {
					setErrorMessages([data.message || 'Failed to verify OTP']);
				}
			}
		} catch {
			setErrorMessages(['Failed to verify OTP']);
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
					{signupSuccess
						? 'Signup Successful!'
						: otpSent
							? 'Verify OTP'
							: 'Welcome! Sign Up Here!'}
				</Typography>

				{signupSuccess && pendingApproval ? (
					<Stack spacing={2.5}>
						<Alert severity="info" sx={{ mb: 2 }}>
							Your account has been created successfully! However, your account
							is pending approval from an administrator.
						</Alert>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Once your account has been approved, please log back in to access
							the application.
						</Typography>
						<Button
							variant="contained"
							fullWidth
							onClick={() => navigate('/login')}
							sx={{ mt: 2 }}
						>
							Go to Login
						</Button>
					</Stack>
				) : !otpSent ? (
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
									setErrorMessages([]);
								}}
								sx={{ cursor: 'pointer' }}
							>
								Go back to Signup
							</Link>
						</Typography>
					</Stack>
				)}

				{errorMessages.length > 0 && (
					<Stack spacing={1} sx={{ mt: 2 }}>
						{errorMessages.map((error, index) => (
							<Alert key={index} severity="error">
								{error}
							</Alert>
						))}
					</Stack>
				)}
			</Box>
		</Box>
	);
}
