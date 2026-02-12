import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel
} from '@mui/material';

import StaffDashboardRow from './StaffDashboardRow';

interface StaffMember {
	id: string;
	name: string;
	position: string;
	locationObjectId: string;
	phone: string;
	approvalStatus: string;
}

interface StaffDashboardTableProps {
	staff: StaffMember[];
	usersData: any[]; // Full user objects for CASL permission checks
	sortConfig: {
		key: keyof StaffMember | null;
		direction: 'asc' | 'desc';
	};
	onSort: (key: keyof StaffMember) => void;
	onApproval: (id: string, status: string) => void;
	onEdit: (id: string) => void;
	onDelete: (id: string) => void;
}

export default function StaffDashboardTable({
	staff,
	usersData,
	sortConfig,
	onSort,
	onApproval,
	onEdit,
	onDelete
}: StaffDashboardTableProps) {
	return (
		<TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
			<Table stickyHeader>
				<TableHead>
					<TableRow>
						<TableCell
							sx={{
								fontWeight: 600,
								backgroundColor: '#f9f9f9'
							}}
						>
							<TableSortLabel
								active={sortConfig.key === 'name'}
								direction={
									sortConfig.key === 'name'
										? sortConfig.direction
										: 'asc'
								}
								onClick={() => onSort('name')}
							>
								Name
							</TableSortLabel>
						</TableCell>
						<TableCell
							sx={{
								fontWeight: 600,
								backgroundColor: '#f9f9f9'
							}}
						>
							<TableSortLabel
								active={sortConfig.key === 'position'}
								direction={
									sortConfig.key === 'position'
										? sortConfig.direction
										: 'asc'
								}
								onClick={() => onSort('position')}
							>
								Role
							</TableSortLabel>
						</TableCell>
						<TableCell
							sx={{
								fontWeight: 600,
								backgroundColor: '#f9f9f9'
							}}
						>
							<TableSortLabel
								active={sortConfig.key === 'locationObjectId'}
								direction={
									sortConfig.key === 'locationObjectId'
										? sortConfig.direction
										: 'asc'
								}
								onClick={() => onSort('locationObjectId')}
							>
								Location
							</TableSortLabel>
						</TableCell>
						<TableCell
							sx={{
								fontWeight: 600,
								backgroundColor: '#f9f9f9'
							}}
						>
							<TableSortLabel
								active={sortConfig.key === 'phone'}
								direction={
									sortConfig.key === 'phone'
										? sortConfig.direction
										: 'asc'
								}
								onClick={() => onSort('phone')}
							>
								Phone Number
							</TableSortLabel>
						</TableCell>
						<TableCell
							sx={{
								fontWeight: 600,
								backgroundColor: '#f9f9f9'
							}}
						>
							<TableSortLabel
								active={sortConfig.key === 'approvalStatus'}
								direction={
									sortConfig.key === 'approvalStatus'
										? sortConfig.direction
										: 'asc'
								}
								onClick={() => onSort('approvalStatus')}
							>
								Status
							</TableSortLabel>
						</TableCell>
						<TableCell
							sx={{
								fontWeight: 600,
								backgroundColor: '#f9f9f9',
								width: 80
							}}
						>
							Actions
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{staff.length === 0 ? (
						<TableRow>
							<TableCell colSpan={6} align="center">
								No staff members found.
							</TableCell>
						</TableRow>
					) : (
						staff.map((member: StaffMember) => {
							// Find the corresponding full user object for CASL checks
							const userData = usersData.find(
								(u: any) => u._id === member.id
							);
							return (
								<StaffDashboardRow
									key={member.id}
									member={member}
									userData={userData}
									onApproval={onApproval}
									onEdit={onEdit}
									onDelete={onDelete}
								/>
							);
						})
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
