import { useState } from 'react';

import { useApi } from '@/hooks';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';

import {
	FormInput,
	LocationSelect,
	PhoneInput,
	RoleSelect
} from '@/components/forms';

export default function NewUser() {
	const { userService } = useApi();
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [locationObjectId, setLocationObjectId] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [role, setRole] = useState('');
	const [message, setMessage] = useState('');

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault();

		try {
			const createdUser = await userService.createUser({
				locationObjectId,
				firstName,
				lastName,
				email,
				phone,
				role
			});

			if (createdUser) {
				// REVIEW: we never get "message" because of normalization.
				// REVIEW: Remove .message if being used elsewhere.
				setMessage(createdUser.message ?? 'User created successfully!');
			} else {
				setMessage('Failed to create user.');
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
