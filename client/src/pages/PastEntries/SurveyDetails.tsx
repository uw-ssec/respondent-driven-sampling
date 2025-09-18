import { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import Header from '@/pages/Header/Header';

import '@/styles/SurveyDetailsCss.css';

import { getAuthToken, getEmployeeId, getRole } from '@/utils/authTokenHandler';

import { LogoutProps } from '@/types/AuthProps';
import { Survey } from '@/types/Survey';

export default function SurveyDetails({ onLogout }: LogoutProps) {
	const { id } = useParams();
	const navigate = useNavigate();
	const [survey, setSurvey] = useState<Survey>();
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	// Renaming the json names
	const labelMap: Record<string, string> = {
		first_two_letters_fname: 'First two letters of first name',
		first_two_letters_lname: 'First two letters of last name',
		year_born: 'Year born',
		month_born: 'Month born',
		location: 'Location',
		interpreter: 'Using interpreter?',
		language: 'Language (if using interpreter)',
		phone_number: 'Phone number',
		email: 'Email',
		email_consent: 'Consent to email',
		age_for_consent: 'Age 18 or over?',
		consent_given: 'Oral consent given?',
		homeless_people_count:
			'Number of people experiencing homelessness you know',
		people_you_know: 'People you know experiencing homelessness',
		sleeping_location_last_night: 'Sleeping Location Last Night',
		homeless_duration_since_housing: 'Homeless Duration Since Housing',
		homeless_occurrences_past_3_years: 'Homeless Occurrences Past 3 Years',
		months_homeless: 'Months Homeless',
		age: 'Age',
		hispanic_latino: 'Hispanic/Latino',
		veteran: 'Veteran',
		fleeing_dv: 'Fleeing Domestic Violence',
		disability: 'Disability',
		mental_illness: 'Mental Illness',
		substance_abuse: 'Substance Abuse',
		city_lasthoused: 'City Last Housed',
		minutes_traveled: 'Minutes Traveled',
		events_conditions: 'Events/Conditions',
		shelter_preferences: 'Shelter Preferences',
		person_name: 'Name',
		relationship: 'Relationship',
		current_sleeping_location: 'Current Sleeping Location'
	};

	useEffect(() => {
		const fetchSurvey = async () => {
			try {
				const role = getRole();
				const employeeId = getEmployeeId();

				// Fetch survey details from the server
				const token = getAuthToken();
				const response = await fetch(`/api/surveys/${id}`, {
					headers: {
						'x-user-role': role,
						'x-employee-id': employeeId,
						Authorization: `Bearer ${token}`
					}
				});

				if (response.ok) {
					const data = await response.json();
					setSurvey(data);
				} else if (response.status == 401) {
					// Token Error, either expired or invalid for some other reason.
					// Log user out so they can relogin to generate a new valid token
					onLogout();
					navigate('/login');
					return;
				} else {
					console.error('Failed to fetch survey details.');
				}
			} catch (error) {
				console.error('Error fetching survey details:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchSurvey();
	}, [id]);

	if (loading) return <p>Loading...</p>;
	if (!survey) return <p>Survey not found.</p>;

	console.log('survey from details', survey);

	// Function to handle logout
	return (
		<div>
			<Header onLogout={onLogout} />
			<br />
			<br />
			<br />
			<div className="survey-details-container">
				<h2>Survey Details</h2>

				<div className="survey-info">
					<p>
						<strong>Employee ID:</strong> {survey.employeeId}
					</p>
					<p>
						<strong>Employee Name:</strong> {survey.employeeName}
					</p>
					<p>
						<strong>Submitted At:</strong>{' '}
						{new Date(survey.createdAt).toLocaleString()}
					</p>
				</div>

				{/* Referral Code Information */}
				<div className="referral-info">
					<h3>Referral Information</h3>
					<p>
						<strong>Referred By Code:</strong>{' '}
						{survey.referredByCode ? survey.referredByCode : 'N/A'}
					</p>

					<p>
						<strong>Generated Referral Codes:</strong>
					</p>
					{survey.referralCodes && survey.referralCodes.length > 0 ? (
						<ul className="referral-list">
							{survey.referralCodes.map((rc, index) => (
								<li key={index} className="referral-code-tag">
									{rc.code}
								</li>
							))}
						</ul>
					) : (
						<p>N/A</p>
					)}
				</div>

				{/* Survey Responses */}
				<div className="responses-section">
					<h3>Survey Responses</h3>
					<pre>
						{survey.responses &&
							Object.entries(survey.responses)
								.map(([question, answer]) => {
									const label =
										labelMap[question] || question;

									if (
										question === 'people_you_know' &&
										Array.isArray(answer)
									) {
										return (
											`\n${label}:\n` +
											answer
												.map((person, index) => {
													return (
														`  Person ${index + 1}:\n` +
														Object.entries(person)
															.map(
																([key, val]) =>
																	`    ${key}: ${val}`
															)
															.join('\n')
													);
												})
												.join('\n\n')
										);
									} else {
										return `${label}: ${answer}`;
									}
								})
								.join('\n\n')}
					</pre>
				</div>
				{/* Edit Pre-screen Questions Button */}
				<button
					className="edit-button"
					onClick={() =>
						navigate(`/survey/${id}/edit`)
					}
				>
					Edit Prescreen Responses
				</button>
			</div>
		</div>
	);
}