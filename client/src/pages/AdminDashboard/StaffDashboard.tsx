import { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import '@/styles/StaffDashboard.css';

import { useAbility, useApi } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';

import editPencil from '@/assets/pencil.png';
import trash from '@/assets/trash.png';

// Description: Dashboard for administrators to view, approve/reject, search, and sort application users.

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

	const [sortConfig, setSortConfig] = useState<{
		key: keyof StaffMember | null;
		direction: 'asc' | 'desc';
	}>({
		key: null,
		direction: 'asc'
	});
	const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

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
		let dir: 'asc' | 'desc' = 'asc';
		if (sortConfig.key === key && sortConfig.direction === 'asc')
			dir = 'desc';
		setSortConfig({ key, direction: dir });
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

	const indexLast = currentPage * itemsPerPage;
	const indexFirst = indexLast - itemsPerPage;
	const currentStaff = sortedAndFilteredStaff.slice(indexFirst, indexLast);
	const totalPages = Math.ceil(sortedAndFilteredStaff.length / itemsPerPage);

	const renderSortIcons = (key: keyof StaffMember) => {
		if (sortConfig.key === key) {
			return sortConfig.direction === 'asc' ? '↑' : '↓';
		}
		return '↑↓';
	};

	return (
		<>
			{/* Main dashboard layout */}
			<div className="dashboard-container">
				<h2 className="dashboard-title">Staff Dashboard</h2>
				<div className="flex-box">
					{/* Controls for delete, filter, and search */}
					<div className="top-controls">
						<button className="control-button">
							<img src={trash} alt="Delete" /> Delete
						</button>
						<input
							type="search"
							className="search-input"
							placeholder="Search Name..."
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
						/>
						<select
							className="search-input"
							value={filterRole}
							onChange={e => setFilterRole(e.target.value)}
						>
							<option value="">All Roles</option>
							<option value="ADMIN">Admin</option>
							<option value="MANAGER">Manager</option>
							<option value="VOLUNTEER">Volunteer</option>
						</select>
					</div>

					{/* Column headers */}
					<div className="list-header">
						<div
							className="header-item"
							onClick={() => handleSort('name')}
						>
							Name{' '}
							<span className="sort-icons">
								{renderSortIcons('name')}
							</span>
						</div>
						<div
							className="header-item"
							onClick={() => handleSort('position')}
						>
							Position{' '}
							<span className="sort-icons">
								{renderSortIcons('position')}
							</span>
						</div>
						<div
							className="header-item"
							onClick={() => handleSort('approvalStatus')}
						>
							Status{' '}
							<span className="sort-icons">
								{renderSortIcons('approvalStatus')}
							</span>
						</div>
						<div className="header-item test"></div>
					</div>

					{/* Staff rows */}
					{currentStaff.map((member: StaffMember) => (
						<div className="list-row" key={member.id}>
							<div className="header-item">
								<input
									type="radio"
									name="selectedStaff"
									className="radio-button"
									checked={selectedStaffId === member.id}
									onChange={() =>
										setSelectedStaffId(member.id)
									}
								/>
								{member.name}
							</div>
							<div className="header-item">{member.position}</div>
							<div className="header-item">
								{member.approvalStatus === 'PENDING' ? (
									<div className="list-status">
										<div className="approval-buttons">
											<button
												className="approve-button"
												onClick={() =>
													handleApproval(
														member.id,
														'APPROVED'
													)
												}
											>
												Approve
											</button>
											<button
												className="reject-button"
												onClick={() =>
													handleApproval(
														member.id,
														'REJECTED'
													)
												}
											>
												Reject
											</button>
										</div>
									</div>
								) : (
									member.approvalStatus
								)}
							</div>
							<div className="header-item test">
								{ability.can(
									ACTIONS.CASL.UPDATE,
									SUBJECTS.USER
								) && (
									<img
										src={editPencil}
										alt="edit"
										className="list-edit"
										onClick={() =>
											navigate(`/profile/${member.id}`)
										}
									/>
								)}
							</div>
						</div>
					))}

					{currentStaff.length < itemsPerPage &&
						Array.from({
							length: itemsPerPage - currentStaff.length
						}).map((_, value) => (
							<div className="list-row" key={`empty-${value}`} />
						))}
					{/* Footer with pagination arrows and new user button */}
					<div className="staff-footer">
						<button
							className="new-user-button"
							onClick={() => navigate('/add-new-user')}
						>
							New User
						</button>
						<div className="pagination-controls">
							<button
								className="arrow-button"
								onClick={() =>
									setCurrentPage(p => Math.max(p - 1, 1))
								}
								disabled={currentPage === 1}
							>
								&larr;
							</button>
							<span className="pagination-info">
								Page {currentPage} of {totalPages}
							</span>
							<button
								className="arrow-button"
								onClick={() =>
									setCurrentPage(p =>
										Math.min(p + 1, totalPages)
									)
								}
								disabled={currentPage >= totalPages}
							>
								&rarr;
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
