import * as React from 'react';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	InputLabel,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	TextField
} from '@mui/material';

import { toPacificDateOnlyString } from '../utils/SurveyEntryDashboardUtils';

interface FilterDialogProps {
	open: boolean;
	filterMode: string;
	selectedDate: Date;
	selectedLocation: string | null;
	locations: string[];
	onClose: () => void;
	onApply: (mode: string, date: Date, location: string | null) => void;
}

export default function FilterDialog({
	open,
	filterMode,
	selectedDate,
	selectedLocation,
	locations,
	onClose,
	onApply
}: FilterDialogProps) {
	const [tempFilterMode, setTempFilterMode] = React.useState(filterMode);
	const [tempSelectedDate, setTempSelectedDate] =
		React.useState(selectedDate);
	const [tempSelectedLocation, setTempSelectedLocation] =
		React.useState<string | null>(selectedLocation);

	React.useEffect(() => {
		if (open) {
			setTempFilterMode(filterMode);
			setTempSelectedDate(selectedDate);
			setTempSelectedLocation(selectedLocation);
		}
	}, [open, filterMode, selectedDate, selectedLocation]);

	const handleApply = () => {
		onApply(tempFilterMode, tempSelectedDate, tempSelectedLocation);
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
			<DialogTitle>Filter Options</DialogTitle>
			<DialogContent>
				<RadioGroup
					value={tempFilterMode}
					onChange={e => setTempFilterMode(e.target.value)}
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
							const [y, m, d] = e.target.value
								.split('-')
								.map(Number);
							setTempSelectedDate(new Date(y, m - 1, d));
						}}
					/>
				)}

				<FormControl fullWidth sx={{ mt: 2 }}>
					<InputLabel id="location-filter-label">Location</InputLabel>
					<Select
						labelId="location-filter-label"
						value={tempSelectedLocation ?? ''}
						label="Location"
						onChange={e => setTempSelectedLocation(e.target.value || null)}
					>
						<MenuItem value="">All Locations</MenuItem>
						{locations.map(location => (
							<MenuItem key={location} value={location}>
								{location}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button variant="contained" onClick={handleApply}>
					Apply
				</Button>
			</DialogActions>
		</Dialog>
	);
}
