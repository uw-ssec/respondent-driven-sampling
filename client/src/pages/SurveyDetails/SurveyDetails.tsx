import { useRef } from 'react';

import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router-dom';

import '@/styles/SurveyDetailsCss.css';
import '@/styles/complete.css';

import { printQrCodePdf } from '@/utils/qrCodeUtils';

import { useApi } from '@/hooks/useApi';

export default function SurveyDetails() {
	const { id } = useParams();
	const { surveyService } = useApi();
	const { data: survey, isLoading: loading } =
		surveyService.useSurveyWithUser(id ?? '') || {};
	const navigate = useNavigate();
	const qrRefs = useRef<(HTMLDivElement | null)[]>([]);

	// Renaming the json names
	// TODO: verify these are the correct names for FA25 survey
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

	if (loading) return <p>Loading...</p>;
	if (!survey) return <p>Survey not found.</p>;

	// Generate PDF with custom paper size (62mm width)
	const handlePrint = () => {
		if (!survey?.childSurveyCodes || survey.childSurveyCodes.length === 0) {
			return;
		}
		printQrCodePdf(qrRefs.current, survey.childSurveyCodes);
	};

	// Function to handle logout
	return (
		<div>
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
						{survey.parentSurveyCode ?? 'N/A'}
					</p>

					<p>
						<strong>Generated Referral Codes:</strong>
					</p>
					{survey.childSurveyCodes &&
					survey.childSurveyCodes.length > 0 ? (
						<ul className="referral-list">
							{survey.childSurveyCodes.map(
								(code: string, index: number) => (
									<li
										key={index}
										className="referral-code-tag"
									>
										{code}
									</li>
								)
							)}
						</ul>
					) : (
						<p>N/A</p>
					)}
					{/* Display QR Codes */}
					<div className="print-area">
						<div className="qr-code-container">
							{survey.childSurveyCodes &&
							survey.childSurveyCodes.length > 0 ? (
								survey.childSurveyCodes.map(
									(code: string, index: number) => {
										const qrSurveyCode = code;
										return (
											<div
												key={index}
												className="qr-box"
												ref={el => {
													qrRefs.current[index] = el;
												}}
											>
												<QRCodeCanvas
													value={qrSurveyCode}
													size={120}
													level="M"
												/>
												<p className="qr-code-text">
													{index + 1}. Referral Code:{' '}
													{code}
												</p>
											</div>
										);
									}
								)
							) : (
								<p>No referral codes available.</p>
							)}
						</div>
					</div>
					<div className="qr-buttons">
						<button className="generate-btn" onClick={handlePrint}>
							Print QR Codes
						</button>
					</div>
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
					onClick={() => navigate(`/survey/${id}/edit`)}
				>
					Edit Prescreen Responses
				</button>
			</div>
		</div>
	);
}
