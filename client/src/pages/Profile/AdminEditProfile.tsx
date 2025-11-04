import { useEffect, useState } from 'react';

import { useAuthContext } from '@/contexts';
import { getAuthToken, getRole } from '@/utils/authTokenHandler';
import { useNavigate, useParams } from 'react-router-dom';

import { User } from '@/types/User';

export default function AdminEditProfile() {
	const { onLogout } = useAuthContext();
	const { id } = useParams();
	const [user, setUser] = useState<User | null>(null);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [storedRole, setStoredRole] = useState<string | null>('');
	const navigate = useNavigate();

	// useEffect to retrieve role from localStorage
	useEffect(() => {
		const storedRole = getRole();
		setStoredRole(storedRole);
	});

	useEffect(() => {
		const fetchProfile = async () => {
			try {
				const token = getAuthToken();
				const response = await fetch(`/api/auth/users/by-id/${id}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				if (response.ok) {
					const data = await response.json();
					setUser(data);
				} else if (response.status == 401) {
					// Token Error, either expired or invalid for some other reason.
					// Log user out so they can relogin to generate a new valid token
					onLogout();
					navigate('/login');
					return;
				} else {
					throw new Error('Failed to fetch user profile.');
				}
			} catch (err) {
				console.error('Error fetching profile:', err);
				setError('Error fetching profile.');
			}
		};

		if (id) {
			fetchProfile();
		}
	}, [id]);

	const handleSave = async () => {
		if (!user) return;

		try {
			const token = getAuthToken();
			const response = await fetch(`/api/auth/users/by-id/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({
					role: user.role,
					email: user.email,
					phone: user.phone
				})
			});

			const data = await response.json();
			if (response.ok) {
				setMessage('Profile updated successfully!');
			} else if (response.status == 401) {
				// Token Error, either expired or invalid for some other reason.
				// Log user out so they can relogin to generate a new valid token
				onLogout();
				navigate('/login');
				return;
			} else {
				setMessage(data.message || 'Failed to update profile.');
			}
		} catch (error) {
			console.error('Error updating profile:', error);
			setMessage('Server error. Try again later.');
		}
	};

	const handleChange = (field: string, value: string) => {
		if (field === 'phone') {
			if (!value.startsWith('+1')) {
				value = '+1' + value.replace(/^\+?1?/, ''); // ensures only one +1
			}
		}

		setUser(prev => {
			if (!prev) return null;
			return {
				...prev,
				[field]: value
			};
		});
	};

	return (
		<>
			<div className="edit-profile-container">
				<div className="edit-profile-card">
					<h2 className="profile-name">
						Profile for{' '}
						{`${user?.firstName || 'User'} ${user?.lastName || ''}`}
					</h2>

					{error ? (
						<p className="status-message error">{error}</p>
					) : (
						<form
							className="edit-profile-form"
							onSubmit={e => e.preventDefault()}
						>
							<div className="input-group">
								<label>Email</label>
								<input
									type="email"
									value={user?.email || ''}
									onChange={e =>
										handleChange('email', e.target.value)
									}
								/>
							</div>

							<div className="input-group">
								<label>Phone Number</label>
								<input
									type="text"
									value={user?.phone || ''}
									onChange={e =>
										handleChange('phone', e.target.value)
									}
								/>
							</div>

							<div className="input-group">
								<label>Role</label>
								<select
									value={user?.role || ''}
									onChange={e =>
										handleChange('role', e.target.value)
									}
									disabled={storedRole === 'Manager'}
								>
									<option value="">Select a role</option>
									<option value="Admin">Admin</option>
									<option value="Manager">Manager</option>
									<option value="Volunteer">Volunteer</option>
								</select>
							</div>

							<div className="input-group">
								<label>Employee ID</label>
								<input
									type="text"
									value={user?.employeeId || ''}
									disabled
								/>
							</div>

							<button
								type="button"
								className="save-button"
								onClick={handleSave}
							>
								Save Changes
							</button>

							{message && (
								<p className="status-message">{message}</p>
							)}
						</form>
					)}
				</div>
			</div>
		</>
	);
}
