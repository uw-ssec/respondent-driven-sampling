import { useEffect, useState } from 'react';

import { useApi } from '@/hooks';
import { Box, Paper, TablePagination, Typography } from '@mui/material';

import {
	FilterDialog,
	SurveyEntryDashboardControls,
	SurveyEntryTable
} from './components';
import {
	filterSurveysByDate,
	filterSurveysByLocation,
	paginateSurveys,
	searchSurveys,
	sortSurveys,
	toPacificDateOnlyString
} from './utils/SurveyEntryDashboardUtils';

export default function SurveyEntryDashboard() {
	const { surveyService } = useApi();
	const [selectedDate, setSelectedDate] = useState(new Date());
	const [searchTerm, setSearchTerm] = useState('');
	const [viewAll, setViewAll] = useState(false);
	const [filterMode, setFilterMode] = useState('byDate');
	const [showFilterPopup, setShowFilterPopup] = useState(false);
	const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
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
	}, [filterMode, selectedDate, searchTerm, selectedLocation]);

	const handleSort = (key: string) => {
		setSortConfig(prev => ({
			key,
			direction:
				prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
		}));
	};

	const filteredByDate = filterSurveysByDate(
		surveys ?? [],
		viewAll,
		selectedDate
	);
	const filteredByLocation = filterSurveysByLocation(filteredByDate, selectedLocation);
	const sortedSurveys = sortSurveys(filteredByLocation, sortConfig);
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
			key: 'surveyCode',
			label: 'Survey Code',
			sortable: true,
			width: 120
		},
		{ key: 'locationName', label: 'Location', sortable: true, width: 130 },
		{
			key: 'employeeName',
			label: 'Staff Name',
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
		{ key: 'progress', label: 'Progress', sortable: false, width: 120 },
		{
			key: 'actions',
			label: 'Survey Responses',
			sortable: false,
			width: 130
		}
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
				{selectedLocation && ` • Location: ${selectedLocation}`}
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
				selectedLocation={selectedLocation}
				locations={
					Array.from(
						new Set(
							surveys
								?.map(s => s.locationName)
								.filter(Boolean)
						)
					) ?? []
				}
				onClose={() => setShowFilterPopup(false)}
				onApply={(mode, date, location) => {
					setFilterMode(mode);
					setSelectedDate(date);
					setSelectedLocation(location);
				}}
			/>
		</Box>
	);
}
