import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import '@/styles/LandingPage.css';

import Header from '@/pages/Header/Header';
import { getFirstName, getRole } from '@/utils/authTokenHandler';

import { LogoutProps } from '@/types/AuthProps';

export default function LandingPage({ onLogout }: LogoutProps) {
	const navigate = useNavigate();
	const [firstName, setFirstName] = useState('');
	const [role, setRole] = useState('');

	// useEffect to retrieve firstName and role from localStorage
	useEffect(() => {
		const storedFirstName = getFirstName();
		const storedRole = getRole();

		if (storedFirstName) {
			setFirstName(storedFirstName);
		}

		if (storedRole) {
			setRole(storedRole);
		}
	}, []);

	// Function to handle logout
	const handleLogout = () => {
		onLogout();
		navigate('/login');
	};

	// Function to handle navigation to the survey page
	return (
		<>
			<Header onLogout={handleLogout} />
			{/* Main landing container */}
			<div className="landing-container">
				<h1 className="welcome-text">Welcome back, {firstName}!</h1>

				<div className="actions-box">
					<h2>Your Actions:</h2>

					{/*<button
                        className="action-button new-survey"
                        onClick={() => navigate('/survey')}
                    >
                        New Survey
                    </button>*/}

					{/* Actions available to volunteers */}
					{role === 'Volunteer' && (
						<div>
							<button
								className="action-button scan-referral"
								onClick={() => navigate('/apply-referral')}
							>
								New Entry
							</button>

							<button
								className="action-button"
								onClick={() => navigate('/past-entries')}
							>
								View Your Entries
							</button>
						</div>
					)}

					{/* Actions visible to Admins */}
					{role === 'Admin' && (
						<div>
							<button
								className="action-button view-dashboard"
								onClick={() => navigate('/admin-dashboard')}
							>
								View Staff Dashboard
							</button>
							<button
								className="action-button"
								onClick={() => navigate('/survey-entries')}
							>
								View Survey Entries
							</button>
						</div>
					)}

					{/* Actions visible to Managers */}
					{role === 'Manager' && (
						<div>
							<button
								className="action-button view-dashboard"
								onClick={() => navigate('/admin-dashboard')}
							>
								View Staff Dashboard
							</button>
							<button
								className="action-button scan-referral"
								onClick={() => navigate('/apply-referral')}
							>
								New Entry
							</button>

							<button
								className="action-button"
								onClick={() => navigate('/past-entries')}
							>
								View Your Entries
							</button>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
