import { useEffect, useState } from 'react';

import '@/styles/signup.css';

import { useNavigate } from 'react-router-dom';
import { saveToken } from '@/utils/tokenHandling';

export default function Signup() {
	const navigate = useNavigate();
	const [userData, setUserData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		role: ''
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
				saveToken(data.token);
				navigate(data.redirectTo);
			} else {
				setErrorMessage(data.message);
			}
		} catch {
			setErrorMessage('Failed to verify OTP');
		}
	};

	return (
		<div className="page-wrapper">
			<div className="signup-container">
				<h2>{otpSent ? 'Verify OTP' : 'Welcome! Sign Up Here!'}</h2>

				{!otpSent ? (
					<>
						<div className="name-row">
							<input
								type="text"
								name="firstName"
								placeholder="First Name"
								value={userData.firstName}
								onChange={handleChange}
								required
							/>
							<input
								type="text"
								name="lastName"
								placeholder="Last Name"
								value={userData.lastName}
								onChange={handleChange}
								required
							/>
						</div>
						<input
							type="email"
							name="email"
							placeholder="Email"
							value={userData.email}
							onChange={handleChange}
							required
						/>
						<input
							type="text"
							name="phone"
							placeholder="Phone (+1XXXXXXXXXX)"
							value={userData.phone}
							onChange={handlePhoneChange}
							required
						/>
						<select
							name="role"
							value={userData.role}
							onChange={handleChange}
							required
						>
							<option value="">--Select Role--</option>
							<option value="Volunteer">Volunteer</option>
							<option value="Manager">Manager</option>
							<option value="Admin">Admin</option>
						</select>
						<button onClick={sendOtp}>Send OTP</button>
						<p className="switch-auth">
							Already have an account?{' '}
							<span
								onClick={() => navigate('/login')}
								className="auth-link"
							>
								Login
							</span>
						</p>
					</>
				) : (
					<>
						<input
							type="text"
							placeholder="Enter OTP"
							value={otp}
							onChange={e => setOtp(e.target.value)}
							required
						/>
						<button onClick={verifyOtp}>
							Verify OTP & Complete Signup
						</button>
						<p className="resend-otp">
							{countdown > 0 ? (
								`Resend OTP in ${countdown}s`
							) : (
								<button onClick={sendOtp}>Resend OTP</button>
							)}
						</p>
						<p className="switch-auth">
							<span
								onClick={() => {
									setOtpSent(false);
									setOtp('');
									setCountdown(0);
									setErrorMessage('');
								}}
								className="auth-link"
							>
								Go back to Signup
							</span>
						</p>
					</>
				)}

				{errorMessage && (
					<p className="error-message">{errorMessage}</p>
				)}
			</div>
		</div>
	);
}
