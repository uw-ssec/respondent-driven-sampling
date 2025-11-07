import {
	Box,
	Button,
	TextField,
	InputAdornment,
	MenuItem,
	Select,
	FormControl,
	InputLabel
} from '@mui/material';
import {
	Search as SearchIcon
} from '@mui/icons-material';

interface StaffDashboardControlsProps {
	searchTerm: string;
	filterRole: string;
	onSearchChange: (value: string) => void;
	onRoleFilterChange: (value: string) => void;
	onNewUserClick: () => void;
}

export default function StaffDashboardControls({
	searchTerm,
	filterRole,
	onSearchChange,
	onRoleFilterChange,
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
					),
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

