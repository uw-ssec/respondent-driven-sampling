import { Box, Button, TextField, InputAdornment } from '@mui/material';
import { Delete as DeleteIcon, FilterList as FilterIcon, Search as SearchIcon } from '@mui/icons-material';

interface SurveyEntryDashboardControlsProps {
	searchTerm: string;
	onSearchChange: (value: string) => void;
	onFilterClick: () => void;
}

export default function SurveyEntryDashboardControls({
	searchTerm,
	onSearchChange,
	onFilterClick
}: SurveyEntryDashboardControlsProps) {
	return (
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
				onClick={onFilterClick}
				sx={{ color: '#3E236E', borderColor: '#3E236E' }}
			>
				Filter
			</Button>
			<TextField
				size="small"
				placeholder="Search Employee, Location, Ref Code, Survey Data..."
				value={searchTerm}
				onChange={e => onSearchChange(e.target.value)}
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
	);
}

