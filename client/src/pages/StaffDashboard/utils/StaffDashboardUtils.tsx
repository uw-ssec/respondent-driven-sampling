interface StaffMember {
	id: string;
	employeeId: string;
	name: string;
	position: string;
	approvalStatus: string;
}

/**
 * Get color for approval status chip
 */
export const getStatusColor = (status: string): 'warning' | 'success' | 'error' => {
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

/**
 * Filter staff members by search term and role
 */
export const filterStaff = (
	staffMembers: StaffMember[],
	searchTerm: string,
	filterRole: string
): StaffMember[] => {
	return staffMembers.filter(
		(staff: StaffMember) =>
			staff.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(filterRole ? staff.position === filterRole : true)
	);
};

/**
 * Sort staff members based on sort configuration
 */
export const sortStaff = (
	staff: StaffMember[],
	sortConfig: {
		key: keyof StaffMember | null;
		direction: 'asc' | 'desc';
	}
): StaffMember[] => {
	if (!sortConfig.key) return [...staff];

	return [...staff].sort((a, b) => {
		const filterA = a[sortConfig.key!]
			? (a[sortConfig.key!].toLowerCase?.() ?? a[sortConfig.key!])
			: '';
		const filterB = b[sortConfig.key!]
			? (b[sortConfig.key!].toLowerCase?.() ?? b[sortConfig.key!])
			: '';
		
		if (filterA < filterB) return sortConfig.direction === 'asc' ? -1 : 1;
		if (filterA > filterB) return sortConfig.direction === 'asc' ? 1 : -1;
		return 0;
	});
};

/**
 * Paginate staff array
 */
export const paginateStaff = (
	staff: StaffMember[],
	currentPage: number,
	itemsPerPage: number
): StaffMember[] => {
	const startIndex = currentPage * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	return staff.slice(startIndex, endIndex);
};

/**
 * Transform users data to staff members format
 */
export const transformUsersToStaff = (users: any[] | undefined): StaffMember[] => {
	if (!users) return [];
	
	return users.map((user: any) => ({
		id: user._id,
		employeeId: user._id || 'N/A',
		name: `${user.firstName} ${user.lastName}`,
		position: user.role,
		approvalStatus: user.approvalStatus || 'PENDING'
	}));
};

