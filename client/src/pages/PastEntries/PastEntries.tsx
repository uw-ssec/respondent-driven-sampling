// import { useEffect, useState } from 'react';

// import { useNavigate } from 'react-router-dom';

// import '@/styles/PastEntriesCss.css';
// import '@/styles/StaffDashboard.css';

// import { getAuthToken, getEmployeeId, getRole } from '@/utils/authTokenHandler';

// import { Survey } from '@/types/Survey';
// import { useAuth } from '@/hooks/useAuth';

// export default function PastEntries() {
// 	const { handleLogout } = useAuth();
// 	const [surveys, setSurveys] = useState<Survey[]>([]);
// 	const [_loading, setLoading] = useState(true);
// 	const navigate = useNavigate();

// 	// Fetch all surveys when the component mounts
// 	useEffect(() => {
// 		const fetchSurveys = async () => {
// 			try {
// 				// Retrieve from localStorage
// 				const role = getRole();
// 				const employeeId = getEmployeeId();

// 				// Fetch surveys from the server
// 				const token = getAuthToken();
// 				const response = await fetch('/api/surveys/all', {
// 					headers: {
// 						'x-user-role': role,
// 						'x-employee-id': employeeId,
// 						Authorization: `Bearer ${token}`
// 					}
// 				});

// 				if (response.ok) {
// 					const data = await response.json();
// 					console.log('Fetched surveys: ', data);
// 					setSurveys(data);
// 				} else if (response.status == 401) {
// 					// Token Error, either expired or invalid for some other reason.
// 					// Log user out so they can relogin to generate a new valid token
// 					handleLogout();
// 					navigate('/login');
// 					return;
// 				} else {
// 					console.error('Failed to fetch surveys.');
// 				}
// 			} catch (error) {
// 				console.error('Error fetching surveys:', error);
// 			} finally {
// 				setLoading(false);
// 			}
// 		};

// 		fetchSurveys();
// 	}, []);

// 	// If loading, show a loading message
// 	return (
// 		<div className="dashboard-container">
// 			<h2 className="dashboard-title">Past Survey Entries</h2>

// 			<div className="flex-box">
// 				<div className="list-header">
// 					<div className="header-item">Employee ID</div>
// 					<div className="header-item">Employee Name</div>
// 					<div className="header-item">Submitted At</div>
// 					<div className="header-item">Referral Code</div>
// 					<div className="header-item">Survey Responses</div>
// 				</div>

// 				{surveys.map((survey, index) => {
// 					return (
// 						<div className="list-row" key={index}>
// 							<div className="header-item">
// 								{survey.employeeId}
// 							</div>
// 							<div className="header-item">
// 								{survey.employeeName}
// 							</div>

// 							<div className="header-item">
// 								{new Date(survey.createdAt).toLocaleString()}
// 							</div>
// 							<div className="header-item">
// 								{survey.referredByCode
// 									? survey.referredByCode
// 									: 'N/A'}
// 							</div>
// 							<div className="header-item">
// 								<button
// 									onClick={() =>
// 										navigate(`/survey/${survey._id}`)
// 									}
// 									className=""
// 								>
// 									View Details
// 								</button>
// 							</div>
// 						</div>
// 					);
// 				})}
// 			</div>
// 		</div>
// 	);
// }
