import { useEffect, useState } from 'react';

import { useAuthContext } from '@/contexts';
import { useApi } from '@/hooks';
import { Box, Paper, TablePagination, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { StaffDashboardControls, StaffDashboardTable } from './components';
import {
	filterStaff,
	paginateStaff,
	sortStaff,
	transformUsersToStaff
} from './utils/StaffDashboardUtils';

interface StaffMember {
	id: string;
	name: string;
	position: string;
	locationObjectId: string;
	phone: string;
	approvalStatus: string;
}

export default function StaffDashboard() {
	const navigate = useNavigate();
	const { userService, locationService } = useApi();
	const { userObjectId } = useAuthContext();
	const [searchTerm, setSearchTerm] = useState('');
	const [filterRole, setFilterRole] = useState('');
	const [filterLocation, setFilterLocation] = useState('');
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
	const { data: locations } = locationService.useLocations() || {};

	// Reset to first page when filters change
	useEffect(() => {
		setCurrentPage(0);
	}, [searchTerm, filterRole, filterLocation]);

	// Handlers
	const handleApproval = async (id: string, status: string) => {
		try {
			const response = await userService.approveUser(
				id,
				status,
				userObjectId
			);
			if (!response) return;
			mutate(); // Refresh the list
		} catch (err) {
			console.error(`Error updating status to ${status}:`, err);
		}
	};

	const handleSort = (key: keyof StaffMember) => {
		setSortConfig(prev => ({
			key,
			direction:
				prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const handleDelete = async (id: string) => {
		if (window.confirm('Are you sure you want to delete this user?')) {
			try {
				// TODO: Implement delete user API call
				// await userService.deleteUser(id);
				console.log('Delete user:', id);
				mutate(); // Refresh the list
			} catch (err) {
				console.error('Error deleting user:', err);
			}
		}
	};

	// Create location lookup map
	const locationMap = new Map(
		locations?.map(loc => [loc._id, loc.hubName]) ?? []
	);

	// Get unique location names for filter dropdown
	const uniqueLocations = Array.from(
		new Set(locations?.map(loc => loc.hubName).filter(Boolean))
	).sort();

	// Data processing pipeline
	const staffMembers = transformUsersToStaff(users ?? [], locationMap);
	const filteredStaff = filterStaff(staffMembers, searchTerm, filterRole, filterLocation);
	const sortedStaff = sortStaff(filteredStaff, sortConfig);
	const currentStaff = paginateStaff(sortedStaff, currentPage, itemsPerPage);

	// Get corresponding user data for current page (for CASL permission checks)
	const currentUsersData = currentStaff
		.map(staff => users?.find((u: any) => u._id === staff.id))
		.filter(Boolean);

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
				<StaffDashboardControls
					searchTerm={searchTerm}
					filterRole={filterRole}
					filterLocation={filterLocation}
					locations={uniqueLocations}
					onSearchChange={setSearchTerm}
					onRoleFilterChange={setFilterRole}
					onLocationFilterChange={setFilterLocation}
					onNewUserClick={() => navigate('/add-new-user')}
				/>

				<StaffDashboardTable
					staff={currentStaff}
					usersData={currentUsersData}
					sortConfig={sortConfig}
					onSort={handleSort}
					onApproval={handleApproval}
					onEdit={id => navigate(`/profile/${id}`)}
					onDelete={handleDelete}
				/>

				<TablePagination
					component="div"
					count={sortedStaff.length}
					page={currentPage}
					onPageChange={(_e, newPage) => setCurrentPage(newPage)}
					rowsPerPage={itemsPerPage}
					onRowsPerPageChange={e => {
						setItemsPerPage(parseInt(e.target.value, 10));
						setCurrentPage(0);
					}}
					rowsPerPageOptions={[5, 10, 25, 50]}
				/>
			</Paper>
		</Box>
	);
}
