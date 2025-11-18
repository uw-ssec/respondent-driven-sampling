import { useEffect, useMemo, useState } from 'react';

import { useAuthContext } from '@/contexts/AuthContext';
import { useApi } from '@/hooks';
import { Box, Paper, TablePagination, Typography } from '@mui/material';

import { SurveyDocument } from '@/types/Survey';

import {
	FilterDialog,
	SurveyEntryDashboardControls,
	SurveyEntryTable
} from './components';
import {
	filterSurveysByDate,
	paginateSurveys,
	searchSurveys,
	sortSurveys,
	toPacificDateOnlyString
} from './utils/SurveyEntryDashboardUtils';

export default function SurveyEntryDashboard() {
	const { surveyService } = useApi();
	const { userObjectId, userRole, locationObjectId } = useAuthContext();
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [searchTerm, setSearchTerm] = useState('');
	const [viewAll, setViewAll] = useState(false);
	const [filterMode, setFilterMode] = useState('byDate');
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

	useEffect(() => {
		setViewAll(filterMode === 'viewAll');
		setCurrentPage(0);
	}, [filterMode, selectedDate, searchTerm]);

	const handleSort = (key: string) => {
		setSortConfig(prev => ({
			key,
			direction:
				prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	// Data processing pipeline
	const filteredSurveysByUserObjectId = useMemo(() => {
		if (!surveys) return [];
		if (userRole === 'VOLUNTEER') {
			return surveys.filter(
				(survey: SurveyDocument) =>
					survey.createdByUserObjectId == userObjectId
			);
		}
		if (userRole === 'MANAGER') {
			return surveys.filter(
				(survey: SurveyDocument) =>
					survey.locationObjectId === locationObjectId
			);
		}
		// SUPER_ADMIN and ADMIN can see all surveys
		return surveys;
	}, [surveys, userObjectId, userRole, locationObjectId]);
	const filteredSurveys = filterSurveysByDate(
		filteredSurveysByUserObjectId,
		viewAll,
		selectedDate
	);
	const sortedSurveys = sortSurveys(filteredSurveys, sortConfig);
	const searchedSurveys = searchSurveys(sortedSurveys, searchTerm);
	const currentSurveys = paginateSurveys(
		searchedSurveys,
		currentPage,
		itemsPerPage
	);

	const columns = [
		{ key: 'createdAt', label: 'Date & Time', sortable: true, width: 120 },
		// { key: 'employeeId', label: 'Employee ID', sortable: true, width: 120 },
		{
			key: 'employeeName',
			label: 'Employee Name',
			sortable: true,
			width: 120
		},
		{ key: 'locationName', label: 'Location', sortable: true, width: 130 },
		{
			key: 'parentSurveyCode',
			label: 'Referred By Code',
			sortable: true,
			width: 140
		},
		{
			key: 'responses.first_two_letters_fname',
			label: 'First 2 of First',
			sortable: true,
			width: 110
		},
		{
			key: 'responses.first_two_letters_lname',
			label: 'First 2 of Last',
			sortable: true,
			width: 110
		},
		{
			key: 'responses.date_of_birth',
			label: 'Year of Birth',
			sortable: true,
			width: 110
		},
		{
			key: 'actions',
			label: 'Survey Responses',
			sortable: false,
			width: 130
		},
		{ key: 'progress', label: 'Progress', sortable: false, width: 120 }
	];

	return (
		<Box sx={{ p: 3 }}>
			<Typography
				variant="h4"
				sx={{
					mb: 1,
					color: '#3E236E',
					textAlign: 'center',
					fontWeight: 'bold'
				}}
			>
				Survey Entry Dashboard
			</Typography>

			<Typography
				variant="h6"
				sx={{ mb: 2, color: '#ababab', textAlign: 'center' }}
			>
				{viewAll
					? 'Viewing All Survey Entries'
					: `Entries for: ${toPacificDateOnlyString(selectedDate)}`}
			</Typography>

			<Paper elevation={2} sx={{ width: '100%', mb: 2 }}>
				<SurveyEntryDashboardControls
					searchTerm={searchTerm}
					onSearchChange={setSearchTerm}
					onFilterClick={() => setShowFilterPopup(true)}
				/>

				<SurveyEntryTable
					surveys={currentSurveys}
					isLoading={isLoading}
					columns={columns}
					sortConfig={sortConfig}
					onSort={handleSort}
				/>

				<TablePagination
					component="div"
					count={searchedSurveys.length}
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

			<FilterDialog
				open={showFilterPopup}
				filterMode={filterMode}
				selectedDate={selectedDate}
				onClose={() => setShowFilterPopup(false)}
				onApply={(mode, date) => {
					setFilterMode(mode);
					setSelectedDate(date);
				}}
			/>
		</Box>
	);
}
