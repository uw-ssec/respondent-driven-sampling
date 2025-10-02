// @ts-nocheck
// TODO: Remove @ts-nocheck when types are fixed.
import { useEffect, useState } from 'react';

import Header from '@/pages/Header/Header';
import { useNavigate } from 'react-router-dom';

import '@/styles/SurveyDashboard.css';

import { getAuthToken, getEmployeeId, getRole } from '@/utils/authTokenHandler';

import { LogoutProps } from '@/types/AuthProps';
import { Survey } from '@/types/Survey';
import filter from '@/assets/filter.png';
import trash from '@/assets/trash.png';

export default function SurveyEntryDashboard({ onLogout }: LogoutProps) {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [surveys, setSurveys] = useState<Survey[]>([]);
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
	const [searchTerm, setSearchTerm] = useState('');
	const [viewAll, setViewAll] = useState(false);
	const [filterMode, setFilterMode] = useState('byDate');
	const [tempFilterMode, setTempFilterMode] = useState('byDate');
	const [showFilterPopup, setShowFilterPopup] = useState(false);
	const [sortConfig, setSortConfig] = useState<{
		key: string | null;
		direction: string;
	}>({
		key: null,
		direction: 'asc'
	});
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	const toPacificDateOnlyString = (input: string | number | Date) => {
		const d = input instanceof Date ? input : new Date(input);
		if (isNaN(d.getTime())) return '';
		const opts: Intl.DateTimeFormatOptions = {
			timeZone: 'America/Los_Angeles',
			year: 'numeric' as const,
			month: '2-digit' as const,
			day: '2-digit' as const
		};
		const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(d);
		const y = parts.find(p => p.type === 'year')?.value ?? '';
		const m = parts.find(p => p.type === 'month')?.value ?? '';
		const day = parts.find(p => p.type === 'day')?.value ?? '';
		return `${y}-${m}-${day}`;
	};

	const toPacificDateTimeString = (input: string | number | Date) => {
		const d = input instanceof Date ? input : new Date(input);
		if (isNaN(d.getTime())) return '';
		return d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
	};

	useEffect(() => {
		(async () => {
			try {
				const role = getRole();
				const employeeId = getEmployeeId();

				const token = getAuthToken();
				const response = await fetch('/api/surveys/all', {
					headers: {
						'x-user-role': role,
						'x-employee-id': employeeId,
						Authorization: `Bearer ${token}`
					}
				});
				if (response.ok) {
					setSurveys(await response.json());
				} else if (response.status == 401) {
					// Token Error, either expired or invalid for some other reason.
					// Log user out so they can relogin to generate a new valid token
					onLogout();
					navigate('/login');
					return;
				} else {
					console.error('Failed to fetch surveys.');
				}
			} catch (e) {
				console.error('Error fetching surveys:', e);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	useEffect(() => {
		setViewAll(filterMode === 'viewAll');
		setCurrentPage(1);
	}, [filterMode, selectedDate]);

	const handleSort = (key: string | null) => {
		setSortConfig(prev => ({
			key,
			direction:
				prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const filteredSurveys = surveys.filter(s => {
		if (viewAll) return true;
		const surveyDate = toPacificDateOnlyString(s.createdAt);
		const selDate = toPacificDateOnlyString(selectedDate);
		return surveyDate && surveyDate === selDate;
	});

	const sortedSurveys = [...filteredSurveys].sort((a, b) => {
		if (!sortConfig.key) return 0;
		const aSorted = (a[sortConfig.key] ?? '').toString().toLowerCase();
		const bSorted = (b[sortConfig.key] ?? '').toString().toLowerCase();
		return sortConfig.direction === 'asc'
			? aSorted.localeCompare(bSorted)
			: bSorted.localeCompare(aSorted);
	});

	const searchedSurveys = sortedSurveys.filter(s => {
		const search =
			`${s.employeeId} ${s.employeeName} ${s.responses?.location ?? ''} ${s.referredByCode ?? ''}`.toLowerCase();
		return search.includes(searchTerm.toLowerCase());
	});

	const last = currentPage * itemsPerPage;
	const first = last - itemsPerPage;
	const currentSurveys = searchedSurveys.slice(first, last);
	const totalPages = Math.max(
		1,
		Math.ceil(searchedSurveys.length / itemsPerPage)
	);

	return (
		<div>
			<Header onLogout={onLogout} />
			<div className="dashboard-container">
				<h2 className="dashboard-title">Survey Entry Dashboard</h2>

				<div className="date-nav-container">
					<h3>
						{viewAll
							? 'Viewing All Survey Entries'
							: `Entries for: ${toPacificDateOnlyString(selectedDate)}`}
					</h3>
				</div>

				<div className="flex-box-survey">
					<div className="top-controls">
						<button className="control-button">
							<img src={trash} alt="Delete" /> Delete
						</button>
						<button
							className="control-button"
							onClick={() => {
								setTempFilterMode(filterMode);
								setTempSelectedDate(selectedDate);
								setShowFilterPopup(true);
							}}
						>
							<img src={filter} alt="Filter" /> Filter
						</button>
						<input
							type="search"
							className="search-input"
							placeholder="Search Employee ID, Name, Location..."
							value={searchTerm}
							onChange={employee =>
								setSearchTerm(employee.target.value)
							}
						/>
					</div>

					<div className="list-header">
						{[
							['createdAt', 'Date & Time'],
							['employeeId', 'Employee ID'],
							['employeeName', 'Employee Name'],
							['responses.location', 'Location'],
							['referredByCode', 'Referred By Code']
						].map(([key, label]) => (
							<div
								key={key}
								className="header-item"
								onClick={() => handleSort(key)}
							>
								{label} <span className="sort-icons">↑↓</span>
							</div>
						))}
						<div className="header-item">Survey Responses</div>
					</div>

					{loading ? (
						<p>Loading surveys...</p>
					) : searchedSurveys.length === 0 ? (
						<p>No surveys found.</p>
					) : (
						<>
							{currentSurveys.map((s, i) => (
								<div className="list-row" key={i}>
									<div className="header-item">
										{toPacificDateTimeString(s.createdAt)}
									</div>
									<div className="header-item">
										{s.employeeId}
									</div>
									<div className="header-item">
										{s.employeeName}
									</div>
									<div className="header-item">
										{s.responses?.location ?? 'N/A'}
									</div>
									<div className="header-item">
										{s.referredByCode ?? 'N/A'}
									</div>
									<div className="header-item">
										<button
											onClick={() =>
												navigate(`/survey/${s._id}`)
											}
											className="view-details-btn"
										>
											View Details
										</button>
									</div>
								</div>
							))}
							{currentSurveys.length < itemsPerPage &&
								Array.from({
									length: itemsPerPage - currentSurveys.length
								}).map((_, valuePage) => (
									<div
										className="list-row"
										key={`empty-${valuePage}`}
									/>
								))}
						</>
					)}

					<div className="staff-footer">
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

				{showFilterPopup && (
					<div className="popup-overlay">
						<div className="popup-content">
							<h3>Filter Options</h3>
							<form className="popup-form">
								<label>
									<input
										type="radio"
										name="filterOption"
										value="viewAll"
										checked={tempFilterMode === 'viewAll'}
										onChange={() =>
											setTempFilterMode('viewAll')
										}
									/>
									View all surveys
								</label>
								<label>
									<input
										type="radio"
										name="filterOption"
										value="byDate"
										checked={tempFilterMode === 'byDate'}
										onChange={() =>
											setTempFilterMode('byDate')
										}
									/>
									View by date
								</label>
								{tempFilterMode === 'byDate' && (
									<input
										type="date"
										className="date-picker-input"
										value={toPacificDateOnlyString(
											tempSelectedDate
										)}
										onChange={e => {
											const [y, m, d] = e.target.value
												.split('-')
												.map(Number);
											setTempSelectedDate(
												new Date(y, m - 1, d)
											);
										}}
									/>
								)}
							</form>
							<button
								onClick={() => {
									setFilterMode(tempFilterMode);
									setSelectedDate(tempSelectedDate);
									setShowFilterPopup(false);
								}}
							>
								Close
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
