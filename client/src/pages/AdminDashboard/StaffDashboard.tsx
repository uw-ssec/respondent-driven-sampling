import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import '@/styles/StaffDashboard.css';

import filter from '@/assets/filter.png';
import editPencil from '@/assets/pencil.png';
import trash from '@/assets/trash.png';

import { LogoutProps } from '@/types/AuthProps';
import Header from '@/pages/Header/Header';
import { getToken } from '@/utils/tokenHandling';

// Description: Dashboard for administrators to view, approve/reject, search, and sort application users.

interface StaffMember {
	id: string;
	name: string;
	position: string;
	approvalStatus: string;
}

export default function StaffDashboard({ onLogout }: LogoutProps) {
	const navigate = useNavigate();
	const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
	const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
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

	// Fetch users from backend database
	useEffect(() => {
		async function fetchUsers() {
			try {
				const token = getToken();
				const response = await fetch('/api/auth/users', {
					headers: { 'Authorization': `Bearer ${token}` }
				});
				if (!response.ok) {
					// Error fetching user data, possibly user does not have permission
					// to get requested data or token has expired.
					if (response.status == 401) {
						// Token Error, either expired or invalid for some other reason.
						// Log user out so they can relogin to generate a new valid token
						onLogout();
						navigate('/login');
						return;
					}
					console.error(response);
					return;
				}
				const data = await response.json();
				const formatted = data.map(
					(user: {
						_id: any;
						firstName: any;
						lastName: any;
						role: any;
						approvalStatus: any;
					}) => ({
						id: user._id,
						name: `${user.firstName} ${user.lastName}`,
						position: user.role,
						approvalStatus: user.approvalStatus || 'Pending'
					})
				);
				setStaffMembers(formatted);
				setFilteredStaff(formatted);
			} catch (err) {
				console.error('Error fetching users:', err);
			}
		}
		fetchUsers();
	}, []);

	// Filter staff list using search bar
	useEffect(() => {
		const results = staffMembers.filter(
			m =>
				m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.position.toLowerCase().includes(searchQuery.toLowerCase())
		);
		setFilteredStaff(results);
		setCurrentPage(1);
	}, [searchQuery, staffMembers]);

	// Handles the approval/rejection of new accounts
	const handleApproval = async (id: string, status: string) => {
		try {
			const token = getToken();
			const response = await fetch(`/api/auth/users/${id}/approve`, {
				method: 'PUT',
				headers: { 
					'Content-Type': 'application/json', 
					'Authorization': `Bearer ${token}` 
				},
				body: JSON.stringify({ status })
			});
			if (response.ok) {
				setStaffMembers(prev =>
					prev.map(staffMem =>
						staffMem.id === id
							? { ...staffMem, approvalStatus: status }
							: staffMem
					)
				);
			} else if (response.status === 401) {
				// Token Error, either expired or invalid for some other reason.
				// Log user out so they can relogin to generate a new valid token
				onLogout();
				navigate('/login');
			} else {
				// Other Error, possibly user does not have permission to make 
				// the request or their account is not approved.
				console.error(response);
			}
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

		const sorted = [...filteredStaff].sort((a, b) => {
			const filterA = a[key] ? (a[key].toLowerCase?.() ?? a[key]) : '';
			const filterB = b[key] ? (b[key].toLowerCase?.() ?? b[key]) : '';
			if (filterA < filterB) return dir === 'asc' ? -1 : 1;
			if (filterA > filterB) return dir === 'asc' ? 1 : -1;
			return 0;
		});

		setFilteredStaff(sorted);
	};

	const indexLast = currentPage * itemsPerPage;
	const indexFirst = indexLast - itemsPerPage;
	const currentStaff = filteredStaff.slice(indexFirst, indexLast);
	const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

	const renderSortIcons = (key: keyof StaffMember) => {
		if (sortConfig.key === key) {
			return sortConfig.direction === 'asc' ? '↑' : '↓';
		}
		return '↑↓';
	};

	return (
		<>
			<Header onLogout={onLogout} />
			{/* Main dashboard layout */}
			<div className="dashboard-container">
				<h2 className="dashboard-title">Staff Dashboard</h2>
				<div className="flex-box">
					{/* Controls for delete, filter, and search */}
					<div className="top-controls">
						<button className="control-button">
							<img src={trash} alt="Delete" /> Delete
						</button>
						<button className="control-button">
							<img src={filter} alt="Filter" /> Filter
						</button>
						<input
							type="search"
							className="search-input"
							placeholder="Search Name or Position..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
						/>
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
					{currentStaff.map(member => (
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
								{member.approvalStatus === 'Pending' ? (
									<div className="list-status">
										<div className="approval-buttons">
											<button
												className="approve-button"
												onClick={() =>
													handleApproval(
														member.id,
														'Approved'
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
														'Rejected'
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
								<img
									src={editPencil}
									alt="edit"
									className="list-edit"
									onClick={() =>
										navigate(
											`/admin-edit-profile/${member.id}`
										)
									}
								/>
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
