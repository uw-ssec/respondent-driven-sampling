import { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import Header from '@/pages/Header/Header';

import '@/styles/SurveyDetailsCss.css';

import { getAuthToken, getEmployeeId, getRole } from '@/utils/authTokenHandler';

import { LogoutProps } from '@/types/AuthProps';
import { Survey } from '@/types/Survey';

export default function SurveyDetails({ onLogout }: LogoutProps) {
	const { id } = useParams();
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
		interpreter: 'Interpreter used',
		language: 'Language (if using interpreter)',
		phone_number: 'Phone number',
		email: 'Email',
		email_consent: 'Consent to email',
		phone_consent: 'Consent to text',
		age_for_consent: 'Age 18 or over',
		consent_given: 'Oral consent given',
		non_family_network_size: 'Unhoused network size (excluding family)',
		network_details: 'People you know experiencing homelessness details',
		// there is name_pseudo, relationship, and sleeping_situation for each person under network details
		sleeping_situation: 'Sleeping Location Last Night',
		vehicle_amenities: 'Vehicle Amenities',
		personal_amenities: 'Basic Personal Amenities',
		homeless_duration_since_housing: 'Homeless Duration Since Housing',
		homeless_occurrences_past_3_years: 'Homeless Occurrences Past 3 Years',
		months_homeless: 'Months Homeless',
		age_group: 'Age group',
		gender_id: 'Gender',
		hispanic_latino: 'Hispanic/Latino',
		racial_id: 'Racial identity',
		veteran_status: 'Veteran status (self or family)',
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

	// Don't allow completed with revoked or no respondent consent to be edited
	const consentGiven = (survey.responses as any)?.consent_given;
	const isEditable = consentGiven !== 'No' && consentGiven !== undefined;

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
					<div className="responses-list">
						{survey.responses &&
							Object.entries(survey.responses)
								.map(([question, answer]) => {
									const label =
										labelMap[question] || question;

									// Special case: array of people objects
									if (
										(question === 'network_details' || question === 'household_members') &&
										Array.isArray(answer)
									) {
										return (
											<div key={question} className="response-item">
												<strong>{label}:</strong>
												{answer.map((person, index) => (
													<div key={index}>
														<p>Person {index + 1}</p>
														<ul>
															{Object.entries(person).map(([key, val]) => (
																<li key={key}>
																	<strong>{key}:</strong> {String(val)}
																</li>
															))}
														</ul>
													</div>
												))}
											</div>
										);
										// Normal (non-array) question fields
									} else {
										if (Array.isArray(answer)) {
											return (
												<p key={question} className="response-item">
													<strong>{label}:</strong> {answer.join(', ')}
												</p>
											);
										}
									}
									return (
										<p key={question} className="response-item">
											<strong>{label}:</strong> {String(answer)}
										</p>
									);
								})
						}
					</div>
				</div>
				{/* Edit Pre-screen Questions Button */}
				{isEditable ? (
					<button
						className="edit-button"
						onClick={() => navigate(`/survey/${id}/edit`)}
					>
						Edit Prescreen Responses
					</button>
				) : (
					<p className="editing-disabled-message">
						Editing disabled: Consent not given or revoked.
					</p>
				)}
			</div>
		</div>
	);
}