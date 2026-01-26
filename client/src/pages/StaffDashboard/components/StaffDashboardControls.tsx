import { Search as SearchIcon } from '@mui/icons-material';
import {
	Box,
	Button,
	FormControl,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	TextField
} from '@mui/material';

interface StaffDashboardControlsProps {
	searchTerm: string;
	filterRole: string;
	filterLocation: string;
	locations: string[];
	onSearchChange: (value: string) => void;
	onRoleFilterChange: (value: string) => void;
	onLocationFilterChange: (value: string) => void;
	onNewUserClick: () => void;
}

export default function StaffDashboardControls({
	searchTerm,
	filterRole,
	filterLocation,
	locations,
	onSearchChange,
	onRoleFilterChange,
	onLocationFilterChange,
	onNewUserClick
}: StaffDashboardControlsProps) {
	return (
		<Box
			sx={{
				p: 2,
				display: 'flex',
				gap: 2,
				flexWrap: 'wrap',
				alignItems: 'center'
			}}
		>
			<TextField
				size="small"
				placeholder="Search Name..."
				value={searchTerm}
				onChange={e => onSearchChange(e.target.value)}
				sx={{ flexGrow: 1, minWidth: 250 }}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon />
						</InputAdornment>
					)
				}}
			/>

			<FormControl size="small" sx={{ minWidth: 150 }}>
				<InputLabel>Filter Role</InputLabel>
				<Select
					value={filterRole}
					label="Filter Role"
					onChange={e => onRoleFilterChange(e.target.value)}
				>
					<MenuItem value="">All Roles</MenuItem>
					<MenuItem value="ADMIN">Admin</MenuItem>
					<MenuItem value="MANAGER">Manager</MenuItem>
					<MenuItem value="VOLUNTEER">Volunteer</MenuItem>
				</Select>
			</FormControl>

			<FormControl size="small" sx={{ minWidth: 150 }}>
				<InputLabel>Filter Location</InputLabel>
				<Select
					value={filterLocation}
					label="Filter Location"
					onChange={e => onLocationFilterChange(e.target.value)}
				>
					<MenuItem value="">All Locations</MenuItem>
					{locations.map(location => (
						<MenuItem key={location} value={location}>
							{location}
						</MenuItem>
					))}
				</Select>
			</FormControl>

			<Button
				variant="contained"
				onClick={onNewUserClick}
				sx={{
					ml: 'auto',
					backgroundColor: '#3E236E',
					'&:hover': { backgroundColor: '#5F2A96' }
				}}
			>
				New User
			</Button>
		</Box>
	);
}
