import {
	TableRow,
	TableCell,
	Stack,
	IconButton,
	Typography,
	Tooltip,
	Select,
	MenuItem,
	
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAbility } from '@/hooks';
import { ACTIONS, FIELDS, SUBJECTS } from '@/permissions/constants';
import { subject } from '@casl/ability';

interface StaffMember {
	id: string;
	employeeId: string;
	name: string;
	position: string;
	approvalStatus: string;
}

interface StaffDashboardRowProps {
	member: StaffMember;
	userData: any; // The full user object for CASL permission checks
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

	// Convert createdAt to a Date object for CASL comparison
	userData.createdAt = new Date(userData.createdAt);

	// Check permissions for this specific user
	const canEdit = FIELDS.USER.PROFILE.some(field => ability.can(ACTIONS.CASL.UPDATE, subject(SUBJECTS.USER, userData), field));
	const canDelete = ability.can(ACTIONS.CASL.DELETE, subject(SUBJECTS.USER, userData));
	const canApprove = ability.can(ACTIONS.CASL.UPDATE, subject(SUBJECTS.USER, userData), FIELDS.USER.APPROVAL[0]);
	
	return (
		<TableRow 
			hover
			sx={{ 
				'&:hover': { backgroundColor: '#f8f8f8' }
			}}
		>
			<TableCell>
			<Typography 
				variant="body2" 
				sx={{ 
					fontSize: '0.85rem'
				}}
			>
				{member.employeeId}
			</Typography>
		</TableCell>
			<TableCell>{member.name}</TableCell>
			<TableCell>{member.position}</TableCell>
			<TableCell>
				<Tooltip 
					title={canApprove ? "" : "You do not have permission to update this user's status"} 
					arrow
					placement="top"
				>
					<span> {/* Wrapper needed for tooltip on disabled element */}
						<Select
							value={member.approvalStatus}
							onChange={(e) => onApproval(member.id, e.target.value)}
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
										member.approvalStatus === 'APPROVED' ? '#2e7d32' :
										member.approvalStatus === 'REJECTED' ? '#d32f2f' :
										'#0288d1'
								},
								// Border color
								'& .MuiOutlinedInput-notchedOutline': {
									borderColor: 
										member.approvalStatus === 'APPROVED' ? '#4caf50' :
										member.approvalStatus === 'REJECTED' ? '#f44336' :
										'#2196f3'
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
				<Tooltip title={canEdit ? "Edit user" : "You do not have permission to edit this user"} arrow>
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
				<Tooltip title={canDelete ? "Delete user" : "You do not have permission to delete this user"} arrow>
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

