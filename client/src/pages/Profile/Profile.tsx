import { useState } from 'react';

import { useAbility, useApi } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { subject } from '@casl/ability';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';

import {
	FormInput,
	LocationSelect,
	PhoneInput,
	RoleSelect
} from '@/components/forms';

export default function AdminEditProfile() {
	const ability = useAbility();
	const { userService } = useApi();
	const { id } = useParams();
	const [message, setMessage] = useState('');
	const [error, _setError] = useState('');
	const { data: user, mutate } = userService.useUser(id) || {};

	const canEditField = (field: string) => {
		if (!user) return false; // wait until user is fetched
		return ability.can(
			ACTIONS.CASL.UPDATE,
			subject(SUBJECTS.USER, user),
			field
		);
	};

	const handleSave = async () => {
		if (!user) return;

		try {
			const updatePayload: Record<string, any> = {};

			if (canEditField('role')) updatePayload.role = user.role;
			if (canEditField('email')) updatePayload.email = user.email;
			if (canEditField('phone')) updatePayload.phone = user.phone;
			if (canEditField('locationObjectId'))
				updatePayload.locationObjectId = user.locationObjectId;

			const updatedUser = await userService.updateUser(
				id!,
				updatePayload
			);

			if (updatedUser.data) {
				setMessage(
					updatedUser.message || 'Profile updated successfully!'
				);
				mutate?.(); // refetch the user
			} else {
				setMessage(updatedUser.message || 'Failed to update profile.');
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

		mutate?.({ ...user, [field]: value }, false);
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
				Profile for{' '}
				{`${user?.firstName || 'User'} ${user?.lastName || ''}`}
			</Typography>

			{error ? (
				<Alert severity="error">{error}</Alert>
			) : (
				<form onSubmit={e => e.preventDefault()}>
					<Stack spacing={3}>
						<FormInput
							label="Email"
							type="email"
							value={user?.email || ''}
							onChange={e =>
								handleChange('email', e.target.value)
							}
							canEdit={canEditField('email')}
							showTooltip
						/>

						<PhoneInput
							label="Phone Number"
							value={user?.phone || ''}
							onChange={e =>
								handleChange('phone', e.target.value)
							}
							canEdit={canEditField('phone')}
							showTooltip
						/>

						<RoleSelect
							value={user?.role || ''}
							onChange={e =>
								handleChange('role', e.target.value as string)
							}
							canEdit={canEditField('role')}
							showTooltip
						/>

						<LocationSelect
							value={user?.locationObjectId || ''}
							onChange={e =>
								handleChange(
									'locationObjectId',
									e.target.value as string
								)
							}
							canEdit={canEditField('locationObjectId')}
							showTooltip
						/>

						<Button
							type="button"
							variant="contained"
							size="large"
							fullWidth
							onClick={handleSave}
							sx={{ mt: 2 }}
						>
							Save Changes
						</Button>

						{message && (
							<Alert
								severity={
									message.includes('success')
										? 'success'
										: 'info'
								}
							>
								{message}
							</Alert>
						)}
					</Stack>
				</form>
			)}
		</Box>
	);
}
