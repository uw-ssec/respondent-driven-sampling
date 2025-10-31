import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Alert,
	Box,
	Button,
	Container,
	FormControl,
	InputLabel,
	MenuItem,
	Paper,
	Select,
	TextField,
	Typography
} from '@mui/material';

import { saveAuthToken } from '@/utils/authTokenHandler';

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
	const [locations, setLocations] = useState<
		Array<{ _id: string; hubName: string }>
	>([]);

	useEffect(() => {
		const fetchLocations = async () => {
			try {
				const response = await fetch('/api/v2/locations');
				if (response.ok) {
					const data = await response.json();
					setLocations(data.data);
				}
			} catch {
				// Failed to fetch locations - silently handled
			}
		};
		fetchLocations();
	}, []);

	useEffect(() => {
		let timer: string | number | NodeJS.Timeout | undefined;
		if (otpSent && countdown > 0) {
			timer = setTimeout(() => setCountdown(c => c - 1), 1000);
		}
		return () => clearTimeout(timer);
	}, [otpSent, countdown]);

	const handleChange = (e: { target: { name: string; value: string } }) => {
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
				background: 'linear-gradient(to bottom right, #f0f2f5, #e0e6ed)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 2
			}}
		>
			<Container maxWidth="sm">
				<Paper
					elevation={10}
					sx={{
						p: 4,
						borderRadius: 3,
						width: '100%',
						maxWidth: 450,
						textAlign: 'center'
					}}
				>
					<Typography
						variant="h4"
						component="h2"
						sx={{
							mb: 3,
							color: 'primary.main',
							fontWeight: 600
						}}
					>
						{otpSent ? 'Verify OTP' : 'Welcome! Sign Up Here!'}
					</Typography>

					{!otpSent ? (
						<Box component="form" sx={{ mt: 2 }}>
							<Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
								<TextField
									fullWidth
									name="firstName"
									label="First Name"
									value={userData.firstName}
									onChange={handleChange}
									required
									variant="outlined"
								/>
								<TextField
									fullWidth
									name="lastName"
									label="Last Name"
									value={userData.lastName}
									onChange={handleChange}
									required
									variant="outlined"
								/>
							</Box>

							<TextField
								fullWidth
								name="email"
								label="Email"
								type="email"
								value={userData.email}
								onChange={handleChange}
								required
								variant="outlined"
								sx={{ mb: 2 }}
							/>

							<TextField
								fullWidth
								name="phone"
								label="Phone"
								placeholder="+1XXXXXXXXXX"
								value={userData.phone}
								onChange={handlePhoneChange}
								required
								variant="outlined"
								sx={{ mb: 2 }}
							/>

							<FormControl fullWidth sx={{ mb: 2 }}>
								<InputLabel>Location</InputLabel>
								<Select
									name="locationObjectId"
									value={userData.locationObjectId}
									onChange={handleChange}
									label="Location"
									required
								>
									<MenuItem value="">
										<em>--Select Location--</em>
									</MenuItem>
									{locations.map(location => (
										<MenuItem key={location._id} value={location._id}>
											{location.hubName}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							<FormControl fullWidth sx={{ mb: 3 }}>
								<InputLabel>Role</InputLabel>
								<Select
									name="role"
									value={userData.role}
									onChange={handleChange}
									label="Role"
									required
								>
									<MenuItem value="">
										<em>--Select Role--</em>
									</MenuItem>
									<MenuItem value="VOLUNTEER">VOLUNTEER</MenuItem>
									<MenuItem value="MANAGER">MANAGER</MenuItem>
									<MenuItem value="ADMIN">ADMIN</MenuItem>
								</Select>
							</FormControl>

							<Button
								fullWidth
								variant="contained"
								onClick={sendOtp}
								sx={{
									py: 1.5,
									borderRadius: 25,
									fontSize: '16px',
									fontWeight: 600,
									mb: 2
								}}
							>
								Send OTP
							</Button>

							<Typography
								variant="body2"
								color="primary.main"
								sx={{ mt: 2 }}
							>
								Already have an account?{' '}
								<Typography
									component="span"
									onClick={() => navigate('/login')}
									sx={{
										cursor: 'pointer',
										textDecoration: 'underline',
										fontWeight: 500,
										'&:hover': {
											color: 'primary.dark'
										}
									}}
								>
									Login
								</Typography>
							</Typography>
						</Box>
					) : (
						<Box sx={{ mt: 2 }}>
							<TextField
								fullWidth
								label="Enter OTP"
								value={otp}
								onChange={e => setOtp(e.target.value)}
								required
								variant="outlined"
								sx={{ mb: 3 }}
							/>

							<Button
								fullWidth
								variant="contained"
								onClick={verifyOtp}
								sx={{
									py: 1.5,
									borderRadius: 25,
									fontSize: '16px',
									fontWeight: 600,
									mb: 2
								}}
							>
								Verify OTP & Complete Signup
							</Button>

							<Typography variant="body2" sx={{ mb: 2 }}>
								{countdown > 0 ? (
									`Resend OTP in ${countdown}s`
								) : (
									<Button
										variant="text"
										onClick={sendOtp}
										sx={{
											textTransform: 'none',
											fontWeight: 500
										}}
									>
										Resend OTP
									</Button>
								)}
							</Typography>

							<Typography
								variant="body2"
								color="primary.main"
							>
								<Typography
									component="span"
									onClick={() => {
										setOtpSent(false);
										setOtp('');
										setCountdown(0);
										setErrorMessage('');
									}}
									sx={{
										cursor: 'pointer',
										textDecoration: 'underline',
										fontWeight: 500,
										'&:hover': {
											color: 'primary.dark'
										}
									}}
								>
									Go back to Signup
								</Typography>
							</Typography>
						</Box>
					)}

					{errorMessage && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{errorMessage}
						</Alert>
					)}
				</Paper>
			</Container>
		</Box>
	);
}
