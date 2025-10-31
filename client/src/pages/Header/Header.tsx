import React, { useState } from 'react';

import {
	AppBar,
	Box,
	IconButton,
	Menu,
	MenuItem,
	Toolbar,
	Typography
} from '@mui/material';
import {
	AccountCircle,
	Add,
	Folder,
	Home
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { LogoutProps } from '@/types/AuthProps';

function Header({ onLogout }: LogoutProps) {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const navigate = useNavigate();
	const isProfileMenuOpen = Boolean(anchorEl);

	// Function to open the profile menu
	const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	// Function to close the profile menu
	const handleProfileMenuClose = () => {
		setAnchorEl(null);
	};

	// Function to handle navigation to past entries
	const handleViewPastEntries = () => {
		handleProfileMenuClose();
		navigate('/past-entries');
	};

	const handleViewProfile = () => {
		handleProfileMenuClose();
		navigate('/view-profile');
	};

	const goToLanding = () => {
		navigate('/dashboard');
	};

	// Function to handle new entry navigation
	const handleNewEntry = () => {
		navigate('/apply-referral');
	};

	// Function to handle edit survey navigation
	const handleEditSurvey = () => {
		navigate('/survey-entries');
	};

	// Function to handle logout
	const handleLogout = () => {
		handleProfileMenuClose();
		if (onLogout) {
			onLogout();
			navigate('/login');
		}
	};

	return (
		<AppBar 
			position="sticky" 
			sx={{ 
				backgroundColor: 'white',
				boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				borderBottom: '2px solid rgba(0, 0, 0, 0.1)'
			}}
		>
			<Toolbar sx={{ justifyContent: 'space-between', px: 2.5, py: 1 }}>
				{/* Logo with Home Icon */}
				<Box
					onClick={goToLanding}
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 1.25,
						cursor: 'pointer'
					}}
				>
					<Home sx={{ color: 'primary.main', fontSize: 28 }} />
					<Typography
						variant="h5"
						component="h1"
						sx={{
							color: 'primary.main',
							fontWeight: 600,
							fontSize: '1.8rem',
							margin: 0
						}}
					>
						RDS Mobile
					</Typography>
				</Box>

				{/* Navigation Icons */}
				<Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
					{/* New Entry Icon */}
					<IconButton
						onClick={handleNewEntry}
						sx={{ color: 'primary.main' }}
						aria-label="New Entry"
					>
						<Add />
					</IconButton>

					{/* Folder/Survey Icon */}
					<IconButton
						onClick={handleEditSurvey}
						sx={{ color: 'primary.main' }}
						aria-label="Survey Entries"
					>
						<Folder />
					</IconButton>

					{/* Profile Icon */}
					<IconButton
						onClick={handleProfileMenuOpen}
						sx={{ color: 'primary.main' }}
						aria-label="Profile Menu"
					>
						<AccountCircle />
					</IconButton>

					{/* Profile Menu */}
					<Menu
						anchorEl={anchorEl}
						open={isProfileMenuOpen}
						onClose={handleProfileMenuClose}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right'
						}}
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right'
						}}
						sx={{
							'& .MuiPaper-root': {
								backgroundColor: 'rgba(62, 35, 110, 0.95)',
								minWidth: 200,
								mt: 1
							}
						}}
					>
						<MenuItem
							onClick={handleViewProfile}
							sx={{
								color: 'white',
								fontSize: '1.1rem',
								py: 1.5,
								'&:hover': {
									backgroundColor: 'rgba(255, 255, 255, 0.1)'
								}
							}}
						>
							View Profile
						</MenuItem>
						<MenuItem
							onClick={handleViewPastEntries}
							sx={{
								color: 'white',
								fontSize: '1.1rem',
								py: 1.5,
								'&:hover': {
									backgroundColor: 'rgba(255, 255, 255, 0.1)'
								}
							}}
						>
							View Past Entries
						</MenuItem>
						<MenuItem
							onClick={handleLogout}
							sx={{
								color: 'white',
								fontSize: '1.1rem',
								py: 1.5,
								'&:hover': {
									backgroundColor: 'rgba(255, 255, 255, 0.1)'
								}
							}}
						>
							Log Out
						</MenuItem>
					</Menu>
				</Box>
			</Toolbar>
		</AppBar>
	);
}

export default Header;
