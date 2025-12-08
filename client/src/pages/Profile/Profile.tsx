import { useEffect, useState } from 'react';

import { useAuthContext } from '@/contexts';
import { useAbility, useApi } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { subject } from '@casl/ability';
import {
	Alert,
	Box,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Typography
} from '@mui/material';
import { useParams } from 'react-router-dom';

import {
	FormInput,
	LocationSelect,
	PhoneInput,
	RoleSelect
} from '@/components/forms';

export default function Profile() {
	const ability = useAbility();
	const { userService } = useApi();
	const { id } = useParams();
	const [message, setMessage] = useState('');
	const [error, _setError] = useState('');
	const { userObjectId } = useAuthContext();

	const { data: userData } = userService.useUser(id) || {};
	const [userRole, setUserRole] = useState('');
	const [approvalStatus, setApprovalStatus] = useState('');
	const [locationObjectId, setLocationObjectId] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');

	useEffect(() => {
		if (userData) {
			setUserRole(userData.role ?? '');
			setLocationObjectId(String(userData.locationObjectId ?? ''));
			setEmail(userData.email ?? '');
			setPhone(userData.phone ?? '');
			setApprovalStatus(userData.approvalStatus ?? '');
		}
	}, [userData]);

	const canEditField = (field: string) => {
		if (!userData) return false;
		return ability.can(
			ACTIONS.CASL.UPDATE,
			subject(SUBJECTS.USER, userData),
			field
		);
	};

	const handleSave = async () => {
		try {
			const updatePayload: Record<string, any> = {};

			if (canEditField('role')) updatePayload.role = userRole;
			if (canEditField('email')) updatePayload.email = email;
			if (canEditField('phone')) updatePayload.phone = phone;
			if (canEditField('locationObjectId'))
				updatePayload.locationObjectId = locationObjectId;
			if (canEditField('approvalStatus'))
				updatePayload.approvalStatus = approvalStatus;

			const updatedUser = await userService.updateUser(
				id!,
				updatePayload
			);

			if (updatedUser) {
				setMessage('Profile updated successfully!');
			} else {
				setMessage('Failed to update profile.');
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

		switch (field) {
			case 'email':
				setEmail(value);
				break;
			case 'phone':
				setPhone(value);
				break;
			case 'locationObjectId':
				setLocationObjectId(value);
				break;
			case 'role':
				setUserRole(value);
				break;
			case 'approvalStatus':
				setApprovalStatus(value);
				break;
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
				Profile for{' '}
				{`${userData?.firstName ?? 'User'} ${userData?.lastName ?? ''}`}
			</Typography>

			{error ? (
				<Alert severity="error">{error}</Alert>
			) : (
				<form onSubmit={e => e.preventDefault()}>
					<Stack spacing={3}>
						<FormInput
							label="Email"
							type="email"
							value={email ?? ''}
							onChange={e =>
								handleChange('email', e.target.value)
							}
							canEdit={canEditField('email')}
							showTooltip
						/>

						<PhoneInput
							label="Phone Number"
							value={phone ?? ''}
							onChange={e =>
								handleChange('phone', e.target.value)
							}
							canEdit={canEditField('phone')}
							showTooltip
						/>

						<RoleSelect
							value={userRole ?? ''}
							onChange={e =>
								handleChange('role', e.target.value as string)
							}
							canEdit={canEditField('role')}
							showTooltip
						/>

						{userObjectId !== id && (
							<FormControl
								fullWidth
								disabled={!canEditField('approvalStatus')}
							>
								<InputLabel id="approval-status-label">
									Approval Status
								</InputLabel>
								<Select
									labelId="approval-status-label"
									label="Approval Status"
									value={approvalStatus}
									onChange={e =>
										handleChange(
											'approvalStatus',
											e.target.value
										)
									}
									disabled={!canEditField('approvalStatus')}
									variant="outlined"
									sx={{
										backgroundColor: !canEditField(
											'approvalStatus'
										)
											? '#f5f5f5'
											: 'white',
										// Color code based on status
										'& .MuiSelect-select': {
											fontWeight: 500,
											color:
												approvalStatus === 'APPROVED'
													? '#2e7d32'
													: approvalStatus ===
														  'REJECTED'
														? '#d32f2f'
														: '#0288d1'
										},
										// Border color
										'& .MuiOutlinedInput-notchedOutline': {
											borderColor:
												approvalStatus === 'APPROVED'
													? '#4caf50'
													: approvalStatus ===
														  'REJECTED'
														? '#f44336'
														: '#2196f3'
										}
									}}
								>
									<MenuItem value="PENDING">Pending</MenuItem>
									<MenuItem value="APPROVED">
										Approved
									</MenuItem>
									<MenuItem value="REJECTED">
										Rejected
									</MenuItem>
								</Select>
							</FormControl>
						)}

						<LocationSelect
							value={locationObjectId ?? ''}
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
