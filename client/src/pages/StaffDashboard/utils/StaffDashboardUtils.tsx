import { UserDocument } from '@/types/User';

interface StaffMember {
	id: string;
	name: string;
	position: string;
	locationObjectId: string;
	phone: string;
	approvalStatus: string;
}

/**
 * Get color for approval status chip
 */
export const getStatusColor = (
	status: string
): 'warning' | 'success' | 'error' => {
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
 * Filter staff members by search term, role, and location
 */
export const filterStaff = (
	staffMembers: StaffMember[],
	searchTerm: string,
	filterRole: string,
	filterLocation: string
): StaffMember[] => {
	return staffMembers.filter(
		(staff: StaffMember) =>
			staff.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
			(filterRole ? staff.position === filterRole : true) &&
			(filterLocation ? staff.locationObjectId === filterLocation : true)
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
export const transformUsersToStaff = (
	users: UserDocument[] | undefined,
	locationMap: Map<string, string>
): StaffMember[] => {
	if (!users) return [];

	return users.map((user: UserDocument) => ({
		id: user._id,
		name: `${user.firstName} ${user.lastName}`,
		position: user.role,
		locationObjectId: locationMap.get(user.locationObjectId?.toString() ?? '') ?? 'N/A',
		phone: user.phone ?? 'N/A',
		approvalStatus: user.approvalStatus ?? 'PENDING'
	}));
};
