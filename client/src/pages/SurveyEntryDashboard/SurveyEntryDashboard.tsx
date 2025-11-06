// @ts-nocheck
// TODO: Remove @ts-nocheck when types are fixed.
import { useEffect, useState } from 'react';
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
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Radio,
	RadioGroup,
	FormControlLabel,
	Stack,
	TablePagination,
	TableSortLabel,
	InputAdornment,
	Tooltip
} from '@mui/material';
import {
	Delete as DeleteIcon,
	FilterList as FilterIcon,
	Search as SearchIcon
} from '@mui/icons-material';

import { useApi } from '@/hooks';
import { Survey } from '@/types/Survey';
import { useAuth } from '@/hooks/useAuth';

export default function SurveyEntryDashboard() {
	const { handleLogout } = useAuth();
	const { surveyService } = useApi();
	const navigate = useNavigate();
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
	const [searchTerm, setSearchTerm] = useState('');
	const [viewAll, setViewAll] = useState(false);
	const [filterMode, setFilterMode] = useState('byDate');
	const [tempFilterMode, setTempFilterMode] = useState('byDate');
	const [showFilterPopup, setShowFilterPopup] = useState(false);
	const [sortConfig, setSortConfig] = useState<{
		key: string | null;
		direction: 'asc' | 'desc';
	}>({
		key: null,
		direction: 'asc'
	});
	const { data: surveys, isLoading } =
		surveyService.useSurveysWithUsersAndLocations() || {};
	const [currentPage, setCurrentPage] = useState(0); // MUI uses 0-based index
	const [itemsPerPage, setItemsPerPage] = useState(10);

	const toPacificDateOnlyString = (input: string | number | Date) => {
		const d = input instanceof Date ? input : new Date(input);
		if (isNaN(d.getTime())) return '';
		const opts: Intl.DateTimeFormatOptions = {
			timeZone: 'America/Los_Angeles',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		};
		const parts = new Intl.DateTimeFormat('en-US', opts).formatToParts(d);
		const y = parts.find(p => p.type === 'year')?.value || '';
		const m = parts.find(p => p.type === 'month')?.value || '';
		const day = parts.find(p => p.type === 'day')?.value || '';
		return `${y}-${m}-${day}`;
	};

	const toPacificDateTimeString = (input: string | number | Date) => {
		const d = input instanceof Date ? input : new Date(input);
		if (isNaN(d.getTime())) return '';
		return d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
	};

	useEffect(() => {
		setViewAll(filterMode === 'viewAll');
		setCurrentPage(0);
	}, [filterMode, selectedDate, searchTerm]);

	const getNestedValue = (obj: any, path: string) => {
		return path.split('.').reduce((acc, part) => acc?.[part], obj);
	};

	const handleSort = (key: string) => {
		setSortConfig(prev => ({
			key,
			direction:
				prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const filteredSurveys =
		surveys?.filter((s: Survey) => {
			if (viewAll) return true;
			const surveyDate = toPacificDateOnlyString(s.createdAt);
			const selDate = toPacificDateOnlyString(selectedDate);
			return surveyDate && surveyDate === selDate;
		}) || [];

	const sortedSurveys = [...filteredSurveys].sort((a, b) => {
		if (!sortConfig.key) return 0;

		let aValue = getNestedValue(a, sortConfig.key);
		let bValue = getNestedValue(b, sortConfig.key);

		if (sortConfig.key === 'createdAt') {
			aValue = new Date(aValue).getTime();
			bValue = new Date(bValue).getTime();
			return sortConfig.direction === 'asc'
				? aValue - bValue
				: bValue - aValue;
		}

		const aStr = (aValue || '').toString().toLowerCase();
		const bStr = (bValue || '').toString().toLowerCase();

		return sortConfig.direction === 'asc'
			? aStr.localeCompare(bStr)
			: bStr.localeCompare(aStr);
	});

	const searchedSurveys = sortedSurveys.filter(s => {
		const search = [
			s.employeeId,
			s.employeeName,
			s.locationName,
			s.parentSurveyCode,
			s.responses?.first_two_letters_fname,
			s.responses?.first_two_letters_lname,
			s.responses?.date_of_birth
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return search.includes(searchTerm.toLowerCase());
	});

	const currentSurveys = searchedSurveys.slice(
		currentPage * itemsPerPage,
		currentPage * itemsPerPage + itemsPerPage
	);

	const columns = [
		{ key: 'createdAt', label: 'Date & Time', sortable: true, width: 120 },
		{ key: 'employeeId', label: 'Employee ID', sortable: true, width: 120 },
		{ key: 'employeeName', label: 'Employee Name', sortable: true, width: 120 },
		{ key: 'locationName', label: 'Location', sortable: true, width: 130 },
		{ key: 'parentSurveyCode', label: 'Referred By Code', sortable: true, width: 140 },
		{ key: 'responses.first_two_letters_fname', label: 'First 2 of First', sortable: true, width: 110 },
		{ key: 'responses.first_two_letters_lname', label: 'First 2 of Last', sortable: true, width: 110 },
		{ key: 'responses.date_of_birth', label: 'Year of Birth', sortable: true, width: 110 },
		{ key: 'actions', label: 'Survey Responses', sortable: false, width: 130 },
		{ key: 'progress', label: 'Progress', sortable: false, width: 120 }
	];

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" sx={{ mb: 1, color: '#3E236E', textAlign: 'center', fontWeight: 'bold' }}>
				Survey Entry Dashboard
			</Typography>

			<Typography variant="h6" sx={{ mb: 2, color: '#ababab', textAlign: 'center' }}>
				{viewAll
					? 'Viewing All Survey Entries'
					: `Entries for: ${toPacificDateOnlyString(selectedDate)}`}
			</Typography>

			<Paper elevation={2} sx={{ width: '100%', mb: 2 }}>
				{/* Controls */}
				<Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
					<Button
						variant="outlined"
						startIcon={<DeleteIcon />}
						sx={{ color: '#3E236E', borderColor: '#3E236E' }}
					>
						Delete
					</Button>
					<Button
						variant="outlined"
						startIcon={<FilterIcon />}
						onClick={() => {
							setTempFilterMode(filterMode);
							setTempSelectedDate(selectedDate);
							setShowFilterPopup(true);
						}}
						sx={{ color: '#3E236E', borderColor: '#3E236E' }}
					>
						Filter
					</Button>
					<TextField
						size="small"
						placeholder="Search Employee, Location, Ref Code, Survey Data..."
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
						sx={{ flexGrow: 1, minWidth: 300 }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						}}
					/>
				</Box>

				{/* Table */}
				<TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
					<Table stickyHeader>
						<TableHead>
							<TableRow>
								{columns.map(column => (
									<TableCell
										key={column.key}
										sx={{ 
											fontWeight: 600, 
											backgroundColor: '#f9f9f9',
											minWidth: column.width 
										}}
									>
										{column.sortable ? (
											<TableSortLabel
												active={sortConfig.key === column.key}
												direction={sortConfig.key === column.key ? sortConfig.direction : 'asc'}
												onClick={() => handleSort(column.key)}
											>
												{column.label}
											</TableSortLabel>
										) : (
											column.label
										)}
									</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={columns.length} align="center">
										Loading surveys...
									</TableCell>
								</TableRow>
							) : searchedSurveys.length === 0 ? (
								<TableRow>
									<TableCell colSpan={columns.length} align="center">
										No surveys found.
									</TableCell>
								</TableRow>
							) : (
								currentSurveys.map((s, i) => (
									<TableRow 
										key={i}
										hover
										sx={{ '&:hover': { backgroundColor: '#f8f8f8' } }}
									>
										<TableCell>{toPacificDateTimeString(s.createdAt)}</TableCell>
										<TableCell>
											<Tooltip title={s.employeeId} arrow>
												<Typography 
													variant="body2" 
													sx={{ 
														fontSize: '0.85rem',
														maxWidth: '90px',
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: 'nowrap'
													}}
												>
													{s.employeeId}
												</Typography>
											</Tooltip>
										</TableCell>
										<TableCell>{s.employeeName}</TableCell>
										<TableCell>{s.locationName || 'N/A'}</TableCell>
										<TableCell>{s.parentSurveyCode || 'N/A'}</TableCell>
										<TableCell>{s.responses?.first_two_letters_fname || 'N/A'}</TableCell>
										<TableCell>{s.responses?.first_two_letters_lname || 'N/A'}</TableCell>
										<TableCell>{s.responses?.date_of_birth || 'N/A'}</TableCell>
										<TableCell>
											<Button
												size="small"
												variant="contained"
												onClick={() => navigate(`/survey/${s._id}`)}
												sx={{ 
													textTransform: 'none',
													backgroundColor: '#3E236E',
													'&:hover': { backgroundColor: '#5F2A96' }
												}}
											>
												View Details
											</Button>
										</TableCell>
										<TableCell>
											{/* TODO: add some kind of permission check/unlocking functionality here for admin */}
											{s.lastUpdated ? (
												<Chip 
													label="Submitted" 
													color="success" 
													size="small"
												/>
											) : (
												<Button
													size="small"
													variant="outlined"
													onClick={() => navigate(`/survey/${s._id}/continue`)}
													sx={{ textTransform: 'none' }}
												>
													Continue
												</Button>
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
					count={searchedSurveys.length}
					page={currentPage}
					onPageChange={(e, newPage) => setCurrentPage(newPage)}
					rowsPerPage={itemsPerPage}
					onRowsPerPageChange={(e) => {
						setItemsPerPage(parseInt(e.target.value, 10));
						setCurrentPage(0);
					}}
					rowsPerPageOptions={[5, 10, 25, 50]}
				/>
			</Paper>

			{/* Filter Dialog */}
			<Dialog 
				open={showFilterPopup} 
				onClose={() => setShowFilterPopup(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>Filter Options</DialogTitle>
				<DialogContent>
					<RadioGroup
						value={tempFilterMode}
						onChange={(e) => setTempFilterMode(e.target.value)}
					>
						<FormControlLabel
							value="viewAll"
							control={<Radio />}
							label="View all surveys"
						/>
						<FormControlLabel
							value="byDate"
							control={<Radio />}
							label="View by date"
						/>
					</RadioGroup>
					{tempFilterMode === 'byDate' && (
						<TextField
							type="date"
							fullWidth
							sx={{ mt: 2 }}
							value={toPacificDateOnlyString(tempSelectedDate)}
							onChange={e => {
								const [y, m, d] = e.target.value.split('-').map(Number);
								setTempSelectedDate(new Date(y, m - 1, d));
							}}
						/>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowFilterPopup(false)}>Cancel</Button>
					<Button
						variant="contained"
						onClick={() => {
							setFilterMode(tempFilterMode);
							setSelectedDate(tempSelectedDate);
							setShowFilterPopup(false);
						}}
					>
						Apply
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
