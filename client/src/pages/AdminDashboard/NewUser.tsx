import { useState } from 'react';

import '@/styles/profile.css';

import { useAuthContext } from '@/contexts';
import { getAuthToken } from '@/utils/authTokenHandler';
import { useNavigate } from 'react-router-dom';

export default function NewUser() {
	const { onLogout } = useAuthContext();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [role, setRole] = useState('');
	const [message, setMessage] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();

		try {
			// Sends request to pre-approve users
			const token = getAuthToken();
			const response = await fetch('/api/auth/preapprove', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					firstName,
					lastName,
					email,
					phone,
					role
				})
			});

			const data = await response.json();

			if (response.ok) {
				setMessage('User registered successfully!');
			} else if (response.status == 401) {
				// Token Error, either expired or invalid for some other reason.
				// Log user out so they can relogin to generate a new valid token
				onLogout();
				navigate('/login');
			} else {
				setMessage(data.message || 'Failed to register user.');
			}
		} catch (error) {
			console.error('Error creating user:', error);
			setMessage('Server error. Try again later.');
		}
	};

	return (
		<div className="edit-profile-container">
			<div className="edit-profile-card">
				<h2 className="profile-name">Add New User</h2>
				<form className="edit-profile-form" onSubmit={handleSubmit}>
					<div className="input-group">
						{/* First name input */}
						<label>First Name</label>
						<input
							type="text"
							value={firstName}
							onChange={e => setFirstName(e.target.value)}
							required
						/>
					</div>

					<div className="input-group">
						{/* Last name input */}
						<label>Last Name</label>
						<input
							type="text"
							value={lastName}
							onChange={e => setLastName(e.target.value)}
							required
						/>
					</div>

					<div className="input-group">
						{/* Email input */}
						<label>Email</label>
						<input
							type="email"
							value={email}
							onChange={e => setEmail(e.target.value)}
							required
						/>
					</div>

					<div className="input-group">
						{/* Phone number input */}
						<label>Phone Number</label>
						<input
							type="text"
							value={phone}
							onChange={e => setPhone(e.target.value)}
							required
						/>
					</div>

					{/* Role dropdown */}
					<div className="input-group">
						<label>Role</label>
						<select
							value={role}
							onChange={e => setRole(e.target.value)}
							required
						>
							<option value="Volunteer">Volunteer</option>
							<option value="Admin">Admin</option>
						</select>
					</div>

					{/* Submit button */}
					<button type="submit" className="save-button">
						Register User
					</button>

					{message && <p className="status-message">{message}</p>}
				</form>
			</div>
		</div>
	);
}
