import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import Header from '@/pages/Header/Header';

import '@/styles/PastEntriesCss.css';
import '@/styles/StaffDashboard.css';

import { LogoutProps } from '@/types/AuthProps';
import { Survey } from '@/types/Survey';

export default function PastEntries({ onLogout }: LogoutProps) {
	const [surveys, setSurveys] = useState<Survey[]>([]);
	const [_loading, setLoading] = useState(true);
	const navigate = useNavigate();

	// Fetch all surveys when the component mounts
	useEffect(() => {
		const fetchSurveys = async () => {
			try {
				// Retrieve from localStorage
				const role = localStorage.getItem('role') || '';
				const employeeId = localStorage.getItem('employeeId') || '';

				// Fetch surveys from the server
				const response = await fetch('/api/surveys/all', {
					headers: {
						'x-user-role': role,
						'x-employee-id': employeeId
					}
				});

				if (response.ok) {
					const data = await response.json();
					console.log('Fetched surveys: ', data);
					setSurveys(data);
				} else {
					console.error('Failed to fetch surveys.');
				}
			} catch (error) {
				console.error('Error fetching surveys:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchSurveys();
	}, []);

	// If loading, show a loading message
	return (
		<>
			<Header onLogout={onLogout} />

			<div className="dashboard-container">
				<h2 className="dashboard-title">Past Survey Entries</h2>

				<div className="flex-box">
					<div className="list-header">
						<div className="header-item">Employee ID</div>
						<div className="header-item">Employee Name</div>
						<div className="header-item">Submitted At</div>
						<div className="header-item">Referral Code</div>
						<div className="header-item">Survey Responses</div>
					</div>

					{surveys.map((survey, index) => {
						return (
							<div className="list-row" key={index}>
								<div className="header-item">
									{survey.employeeId}
								</div>
								<div className="header-item">
									{survey.employeeName}
								</div>

								<div className="header-item">
									{new Date(
										survey.createdAt
									).toLocaleString()}
								</div>
								<div className="header-item">
									{survey.referredByCode
										? survey.referredByCode
										: 'N/A'}
								</div>
								<div className="header-item">
									<button
										onClick={() =>
											navigate(`/survey/${survey._id}`)
										}
										className=""
									>
										View Details
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
}
