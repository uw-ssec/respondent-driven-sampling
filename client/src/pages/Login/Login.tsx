// src/pages/Login/login.js
import { useEffect, useState } from 'react';

import '@/styles/login.css';

import { useNavigate } from 'react-router-dom';

import { LoginProps } from '../../types/AuthProps';

//Description: Login using email or phone number and OTP verification
export default function Login({ onLogin }: LoginProps) {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
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

	// Sends OTP to user's phone after validation
	const sendOtp = async () => {
		// basic client‑side check
		if (!email || phone.length !== 12) {
			setErrorMessage('Enter a valid email and 10‑digit phone number');
			setSuccessMessage('');
			return;
		}
		try {
			const res = await fetch('/api/auth/send-otp-login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, phone })
			});
			const data = await res.json();
			if (res.ok) {
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
			setErrorMessage('Failed to send OTP');
			setSuccessMessage('');
		}
	};

	// Verifies entered OTP matches with the backend database
	const verifyOtp = async () => {
		try {
			const res = await fetch('/api/auth/verify-otp-login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone, code: otp })
			});
			const data = await res.json();
			if (res.ok) {
				// Successful login and store user data
				onLogin();
				localStorage.setItem('isLoggedIn', 'true');
				localStorage.setItem('firstName', data.firstName);
				localStorage.setItem('role', data.role);
				localStorage.setItem('employeeId', data.employeeId);
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
		<div className="page-wrapper">
			<div className="login-container">
				<h2>{otpSent ? 'Verify OTP' : 'Hi, welcome to RDS Mobile!'}</h2>

				{/* Initial login page */}
				{!otpSent ? (
					<>
						<input
							type="email"
							placeholder="Enter Email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							onKeyDown={handleSendOtpKeyDown}
							required
						/>
						<input
							type="text"
							placeholder="Phone (+1XXXXXXXXXX)"
							value={phone}
							onChange={handlePhoneChange}
							onKeyDown={handleSendOtpKeyDown}
							required
						/>
						<button onClick={sendOtp}>Send OTP &amp; Login</button>
						{/* Button to registration page */}
						<p className="switch-auth">
							Don’t have an account?{' '}
							<span
								onClick={() => navigate('/signup')}
								className="auth-link"
							>
								Sign Up
							</span>
						</p>
					</>
				) : (
					<>
						{/* OTP verification page */}
						<input
							type="text"
							placeholder="Enter OTP"
							value={otp}
							onChange={e => setOtp(e.target.value)}
							onKeyDown={handleVerifyOtpKeyDown}
							required
						/>
						<button onClick={verifyOtp}>
							Verify OTP &amp; Login
						</button>
						{/* Resend OTP button or countdown */}
						<p className="resend-otp">
							{countdown > 0 ? (
								`Resend OTP in ${countdown}s`
							) : (
								<button onClick={sendOtp}>Resend OTP</button>
							)}
						</p>

						{/* Option to go back to email/phone entry */}
						<p className="switch-auth">
							<span
								onClick={() => {
									setOtpSent(false);
									setOtp('');
									setCountdown(0);
									setErrorMessage('');
									setSuccessMessage('');
								}}
								className="auth-link"
							>
								Go back to Login
							</span>
						</p>
					</>
				)}

				{errorMessage && (
					<p className="error-message">{errorMessage}</p>
				)}
				{successMessage && (
					<p className="success-message">{successMessage}</p>
				)}
			</div>
		</div>
	);
}
