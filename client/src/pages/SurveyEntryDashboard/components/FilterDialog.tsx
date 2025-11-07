import * as React from 'react';

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	Radio,
	RadioGroup,
	TextField
} from '@mui/material';

import { toPacificDateOnlyString } from '../utils/SurveyEntryDashboardUtils';

interface FilterDialogProps {
	open: boolean;
	filterMode: string;
	selectedDate: Date;
	onClose: () => void;
	onApply: (mode: string, date: Date) => void;
}

export default function FilterDialog({
	open,
	filterMode,
	selectedDate,
	onClose,
	onApply
}: FilterDialogProps) {
	const [tempFilterMode, setTempFilterMode] = React.useState(filterMode);
	const [tempSelectedDate, setTempSelectedDate] =
		React.useState(selectedDate);

	React.useEffect(() => {
		if (open) {
			setTempFilterMode(filterMode);
			setTempSelectedDate(selectedDate);
		}
	}, [open, filterMode, selectedDate]);

	const handleApply = () => {
		onApply(tempFilterMode, tempSelectedDate);
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
