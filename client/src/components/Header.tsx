import '@/styles/header.css';

import { useEffect, useRef, useState } from 'react';

import { useAuthContext } from '@/contexts';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

export function Header() {
	const { handleLogout } = useAuth();
	const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
	const navigate = useNavigate();
	const menuRef = useRef<HTMLDivElement | null>(null); // Ref to track the menu
	const { userObjectId } = useAuthContext();
	// Function to toggle the profile menu
	const toggleProfileMenu = () => {
		setIsProfileMenuOpen(!isProfileMenuOpen);
	};

	const handleViewProfile = () => {
		navigate(`/profile/${userObjectId}`);
	};

	const goToLanding = () => {
		navigate('/dashboard');
	};

	const goToPreviousPage = () => {
		navigate(-1);
	};

	// Function to handle new entry navigation
	const handleNewEntry = () => {
		navigate('/apply-referral');
	};

	// Function to handle edit survey navigation
	const handleEditSurvey = () => {
		navigate('/survey-entries');
	};

	// Close menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setIsProfileMenuOpen(false);
			}
		};

		// Attach event listener
		document.addEventListener('mousedown', handleClickOutside);

		return () => {
			// Cleanup event listener on component unmount
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Close menu when navigating
	return (
		<div className="header">
			{/* Left Icons Container */}
			<div className="left-icons">
				{/* Previous Page Icon */}
				<div
					className="back-icon"
					onClick={goToPreviousPage}
					style={{ cursor: 'pointer' }}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="#3E236E"
						width="24px"
						height="24px"
					>
						<path d="M0 0h24v24H0z" fill="none" />
						<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
					</svg>
				</div>

				{/* Home Icon */}
				<div
					className="home-icon"
					onClick={goToLanding}
					style={{ cursor: 'pointer' }}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="#3E236E"
						width="24px"
						height="24px"
					>
						<path d="M0 0h24v24H0z" fill="none" />
						<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
					</svg>
				</div>
			</div>

			{/* Centered Title */}
			<h1 className="header-title">Point-in-Time Count 2026</h1>

			{/* Navigation Icons */}
			<div className="nav-icons">
				{/* New Entry/Plus Circle Outline Icon */}
				<div className="nav-icon" onClick={handleNewEntry}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="#3E236E"
						viewBox="0 0 24 24"
						width="24px"
						height="24px"
					>
						<path d="M0 0h24v24H0z" fill="none" />
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v4H7v2h4v4h2v-4h4v-2h-4V7z" />
					</svg>
				</div>

				{/* Folder Stack Icon */}
				<div className="nav-icon" onClick={handleEditSurvey}>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="#3E236E"
						width="24px"
						height="24px"
					>
						<path d="M0 0h24v24H0z" fill="none" />
						<path d="M2 6c0-1.1.9-2 2-2h7l2 2h7c1.1 0 2 .9 2 2v1H2V6zm0 3h20v2H2V9zm0 4h20v6c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-6z" />
					</svg>
				</div>

				{/* Profile Icon */}
				<div
					className="nav-icon profile-icon"
					onClick={toggleProfileMenu}
					ref={menuRef}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="#3E236E"
						width="24px"
						height="24px"
					>
						<path d="M0 0h24v24H0z" fill="none" />
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
					</svg>

					{/* Profile Dropdown Menu */}
					{isProfileMenuOpen && (
						<div className="profile-menu">
							<ul>
								<li onClick={handleViewProfile}>
									View Profile
								</li>
								<li
									onClick={handleLogout}
									className="logout-option"
								>
									Log Out
								</li>
							</ul>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
