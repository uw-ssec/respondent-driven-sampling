import { useAbility } from '@/hooks';
import { ACTIONS, FIELDS, SUBJECTS } from '@/permissions/constants';
import { subject } from '@casl/ability';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import {
	IconButton,
	MenuItem,
	Select,
	Stack,
	TableCell,
	TableRow,
	Tooltip
} from '@mui/material';

import { UserDocument } from '@/types/User';

interface StaffMember {
	id: string;
	name: string;
	position: string;
	locationObjectId: string;
	phone: string;
	approvalStatus: string;
}

interface StaffDashboardRowProps {
	member: StaffMember;
	userData: UserDocument; // The full user object for CASL permission checks
	onApproval: (id: string, status: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
}

export default function StaffDashboardRow({
	member,
	userData,
	onApproval,
	onEdit,
	onDelete
}: StaffDashboardRowProps) {
	const ability = useAbility();

	// Check permissions for this specific user (checking profile and role fields)
	// TODO: this maybe should be a permission on whether or not the user can read these fields
	// and then this logic would wrap the 'Update' button instead on Profile page...
	const canEdit = [
		...FIELDS.USER.PROFILE,
		...FIELDS.USER.ROLE,
		...FIELDS.USER.APPROVAL,
		...FIELDS.USER.LOCATION
	].some(field =>
		ability.can(
			ACTIONS.CASL.UPDATE,
			subject(SUBJECTS.USER, userData),
			field
		)
	);

	const canDelete = ability.can(
		ACTIONS.CASL.DELETE,
		subject(SUBJECTS.USER, userData)
	);
	const canApprove = ability.can(
		ACTIONS.CASL.UPDATE,
		subject(SUBJECTS.USER, userData),
		FIELDS.USER.APPROVAL[0]
	);

	return (
		<TableRow
			hover
			sx={{
				'&:hover': { backgroundColor: '#f8f8f8' }
			}}
		>
			<TableCell>{member.name}</TableCell>
			<TableCell>{member.position}</TableCell>
			<TableCell>{member.locationObjectId}</TableCell>
			<TableCell>{member.phone}</TableCell>
			<TableCell>
				<Tooltip
					title={
						canApprove
							? ''
							: "You do not have permission to update this user's status"
					}
					arrow
					placement="top"
				>
					<span>
						{/* Wrapper needed for tooltip on disabled element */}
						<Select
							value={member.approvalStatus}
							onChange={e =>
								onApproval(member.id, e.target.value)
							}
							disabled={!canApprove}
							size="small"
							sx={{
								fontSize: '0.75rem',
								minWidth: 120,
								// Color code based on status
								'& .MuiSelect-select': {
									py: 0.5,
									fontWeight: 500,
									color:
										member.approvalStatus === 'APPROVED'
											? '#2e7d32'
											: member.approvalStatus ===
												  'REJECTED'
												? '#d32f2f'
												: '#0288d1'
								},
								// Border color
								'& .MuiOutlinedInput-notchedOutline': {
									borderColor:
										member.approvalStatus === 'APPROVED'
											? '#4caf50'
											: member.approvalStatus ===
												  'REJECTED'
												? '#f44336'
												: '#2196f3'
								}
							}}
						>
							<MenuItem value="PENDING">Pending</MenuItem>
							<MenuItem value="APPROVED">Approved</MenuItem>
							<MenuItem value="REJECTED">Rejected</MenuItem>
						</Select>
					</span>
				</Tooltip>
			</TableCell>
			<TableCell>
				<Stack direction="row" spacing={1}>
					<Tooltip
						title={
							canEdit
								? 'Edit user'
								: 'You do not have permission to edit this user'
						}
						arrow
					>
						<span>
							<IconButton
								size="small"
								disabled={!canEdit}
								onClick={() => onEdit(member.id)}
								sx={{
									color: '#3E236E',
									'&.Mui-disabled': {
										color: 'rgba(0, 0, 0, 0.26)'
									}
								}}
							>
								<EditIcon fontSize="small" />
							</IconButton>
						</span>
					</Tooltip>
					<Tooltip
						title={
							canDelete
								? 'Delete user'
								: 'You do not have permission to delete this user'
						}
						arrow
					>
						<span>
							<IconButton
								size="small"
								disabled={!canDelete}
								onClick={() => onDelete(member.id)}
								sx={{
									color: '#d32f2f',
									'&.Mui-disabled': {
										color: 'rgba(0, 0, 0, 0.26)'
									}
								}}
							>
								<DeleteIcon fontSize="small" />
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			</TableCell>
		</TableRow>
	);
}
