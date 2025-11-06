import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Box,
	Button,
	TextField,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	IconButton,
	Chip,
	Typography,
	Radio,
	Stack,
	TablePagination,
	TableSortLabel,
	InputAdornment,
	MenuItem,
	Select,
	FormControl,
	InputLabel
} from '@mui/material';
import {
	Delete as DeleteIcon,
	Edit as EditIcon,
	Search as SearchIcon
} from '@mui/icons-material';

import { useAbility, useApi } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';

interface StaffMember {
	id: string;
	name: string;
	position: string;
	approvalStatus: string;
}

export default function StaffDashboard() {
	const ability = useAbility();
	const navigate = useNavigate();
	const { userService } = useApi();
	const [searchTerm, setSearchTerm] = useState('');
	const [filterRole, setFilterRole] = useState('');
	const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(0); // MUI uses 0-based index
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [sortConfig, setSortConfig] = useState<{
		key: keyof StaffMember | null;
		direction: 'asc' | 'desc';
	}>({
		key: null,
		direction: 'asc'
	});

	const { data: users, mutate } = userService.useUsers() || {};

	const staffMembers =
		users?.map((user: any) => ({
			id: user._id,
			name: `${user.firstName} ${user.lastName}`,
			position: user.role,
			approvalStatus: user.approvalStatus || 'PENDING'
		})) || [];

	// Filter derived from staffMembers
	const filteredStaff = staffMembers.filter(
		(staff: StaffMember) =>
			staff.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(filterRole ? staff.position === filterRole : true)
	);

	// Handles the approval/rejection of new accounts
	const handleApproval = async (id: string, status: string) => {
		try {
			const response = await userService.approveUser(id, status);
			if (!response) return;
			mutate(); // Refresh the list
		} catch (err) {
			console.error(`Error updating status to ${status}:`, err);
		}
	};

	// Sort staff column
	const handleSort = (key: keyof StaffMember) => {
		setSortConfig(prev => ({
			key,
			direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const sortedAndFilteredStaff = [...filteredStaff].sort((a, b) => {
		if (!sortConfig.key) return 0;
		const filterA = a[sortConfig.key]
			? (a[sortConfig.key].toLowerCase?.() ?? a[sortConfig.key])
			: '';
		const filterB = b[sortConfig.key]
			? (b[sortConfig.key].toLowerCase?.() ?? b[sortConfig.key])
			: '';
		if (filterA < filterB) return sortConfig.direction === 'asc' ? -1 : 1;
		if (filterA > filterB) return sortConfig.direction === 'asc' ? 1 : -1;
		return 0;
	});

	const currentStaff = sortedAndFilteredStaff.slice(
		currentPage * itemsPerPage,
		currentPage * itemsPerPage + itemsPerPage
	);

	const getStatusColor = (status: string): 'warning' | 'success' | 'error' => {
		switch (status) {
			case 'PENDING':
				return 'warning';
			case 'APPROVED':
				return 'success';
			case 'REJECTED':
				return 'error';
			default:
				return 'warning';
		}
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography 
				variant="h4" 
				sx={{ 
					mb: 3, 
					color: '#3E236E', 
					textAlign: 'center', 
					fontWeight: 'bold' 
				}}
			>
				Staff Dashboard
			</Typography>

			<Paper elevation={2} sx={{ width: '100%', mb: 2 }}>
				{/* Controls */}
				<Box 
					sx={{ 
						p: 2, 
						display: 'flex', 
						gap: 2, 
						flexWrap: 'wrap', 
						alignItems: 'center' 
					}}
				>
					<Button
						variant="outlined"
						startIcon={<DeleteIcon />}
						sx={{ color: '#3E236E', borderColor: '#3E236E' }}
					>
						Delete
					</Button>
					
					<TextField
						size="small"
						placeholder="Search Name..."
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						sx={{ flexGrow: 1, minWidth: 250 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						}}
					/>

					<FormControl size="small" sx={{ minWidth: 150 }}>
						<InputLabel>Filter Role</InputLabel>
						<Select
							value={filterRole}
							label="Filter Role"
							onChange={e => setFilterRole(e.target.value)}
						>
							<MenuItem value="">All Roles</MenuItem>
							<MenuItem value="ADMIN">Admin</MenuItem>
							<MenuItem value="MANAGER">Manager</MenuItem>
							<MenuItem value="VOLUNTEER">Volunteer</MenuItem>
						</Select>
					</FormControl>

					<Button
						variant="contained"
						onClick={() => navigate('/add-new-user')}
						sx={{ 
							ml: 'auto',
							backgroundColor: '#3E236E',
							'&:hover': { backgroundColor: '#5F2A96' }
						}}
					>
						New User
					</Button>
				</Box>

				{/* Table */}
				<TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
					<Table stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell 
									sx={{ 
										fontWeight: 600, 
										backgroundColor: '#f9f9f9',
										width: 50 
									}}
								>
									Select
								</TableCell>
								<TableCell 
									sx={{ 
										fontWeight: 600, 
										backgroundColor: '#f9f9f9' 
									}}
								>
									<TableSortLabel
										active={sortConfig.key === 'name'}
										direction={sortConfig.key === 'name' ? sortConfig.direction : 'asc'}
										onClick={() => handleSort('name')}
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
										direction={sortConfig.key === 'position' ? sortConfig.direction : 'asc'}
										onClick={() => handleSort('position')}
									>
										Position
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
										direction={sortConfig.key === 'approvalStatus' ? sortConfig.direction : 'asc'}
										onClick={() => handleSort('approvalStatus')}
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
							{currentStaff.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} align="center">
										No staff members found.
									</TableCell>
								</TableRow>
							) : (
								currentStaff.map((member: StaffMember) => (
									<TableRow 
										key={member.id}
										hover
										sx={{ 
											'&:hover': { backgroundColor: '#f8f8f8' },
											backgroundColor: selectedStaffId === member.id ? '#f0f0f0' : 'inherit'
										}}
									>
										<TableCell>
											<Radio
												checked={selectedStaffId === member.id}
												onChange={() => setSelectedStaffId(member.id)}
												value={member.id}
												name="selectedStaff"
											/>
										</TableCell>
										<TableCell>{member.name}</TableCell>
										<TableCell>{member.position}</TableCell>
										<TableCell>
											{member.approvalStatus === 'PENDING' ? (
												<Stack direction="row" spacing={1}>
													<Button
														size="small"
														variant="contained"
														color="success"
														onClick={() => handleApproval(member.id, 'APPROVED')}
														sx={{ textTransform: 'none', fontSize: '0.75rem' }}
													>
														Approve
													</Button>
													<Button
														size="small"
														variant="contained"
														color="error"
														onClick={() => handleApproval(member.id, 'REJECTED')}
														sx={{ textTransform: 'none', fontSize: '0.75rem' }}
													>
														Reject
													</Button>
												</Stack>
											) : (
												<Chip 
													label={member.approvalStatus} 
													color={getStatusColor(member.approvalStatus)}
													size="small"
												/>
											)}
										</TableCell>
										<TableCell>
											{ability.can(ACTIONS.CASL.UPDATE, SUBJECTS.USER) && (
												<IconButton
													size="small"
													onClick={() => navigate(`/profile/${member.id}`)}
													sx={{ color: '#3E236E' }}
												>
													<EditIcon fontSize="small" />
												</IconButton>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>

				{/* Pagination */}
				<TablePagination
					component="div"
					count={sortedAndFilteredStaff.length}
					page={currentPage}
					onPageChange={(_e, newPage) => setCurrentPage(newPage)}
					rowsPerPage={itemsPerPage}
					onRowsPerPageChange={(e) => {
						setItemsPerPage(parseInt(e.target.value, 10));
						setCurrentPage(0);
					}}
					rowsPerPageOptions={[5, 10, 25, 50]}
				/>
			</Paper>
		</Box>
	);
}
