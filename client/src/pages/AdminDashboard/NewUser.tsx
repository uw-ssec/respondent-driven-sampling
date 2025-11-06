import { useState } from 'react';

import { useApi, useAuth } from '@/hooks';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import {
	FormInput,
	LocationSelect,
	PhoneInput,
	RoleSelect
} from '@/components/forms';

export default function NewUser() {
	const { handleLogout } = useAuth();
	const { userService } = useApi();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [locationObjectId, setLocationObjectId] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [role, setRole] = useState('');
	const [message, setMessage] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();

		try {
			const response = await userService.createUser({
				locationObjectId,
				firstName,
				lastName,
				email,
				phone,
				role
			});

			const data = await response.json();

			if (response.ok) {
				setMessage('User registered successfully!');
			} else if (response.status == 401) {
				// Token Error, either expired or invalid for some other reason.
				// Log user out so they can relogin to generate a new valid token
				handleLogout();
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
		<Box
			sx={{
				maxWidth: 600,
				mx: 'auto',
				mt: 4,
				p: 3,
				backgroundColor: 'white',
				borderRadius: 2,
				boxShadow: 2
			}}
		>
			<Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
				Add New User
			</Typography>

			<form onSubmit={handleSubmit}>
				<Stack spacing={3}>
					<FormInput
						label="First Name"
						value={firstName}
						onChange={e => setFirstName(e.target.value)}
						required
					/>

					<FormInput
						label="Last Name"
						value={lastName}
						onChange={e => setLastName(e.target.value)}
						required
					/>

					<FormInput
						label="Email"
						type="email"
						value={email}
						onChange={e => setEmail(e.target.value)}
						required
					/>

					<PhoneInput
						label="Phone Number"
						value={phone}
						onChange={e => setPhone(e.target.value)}
						required
					/>

					<RoleSelect
						value={role}
						onChange={e => setRole(e.target.value as string)}
						required
					/>

					<LocationSelect
						value={locationObjectId}
						onChange={e =>
							setLocationObjectId(e.target.value as string)
						}
						required
					/>

					<Button
						type="submit"
						variant="contained"
						size="large"
						fullWidth
						sx={{ mt: 2 }}
					>
						Register User
					</Button>

					{message && (
						<Alert
							severity={
								message.includes('success')
									? 'success'
									: 'error'
							}
						>
							{message}
						</Alert>
					)}
				</Stack>
			</form>
		</Box>
	);
}
