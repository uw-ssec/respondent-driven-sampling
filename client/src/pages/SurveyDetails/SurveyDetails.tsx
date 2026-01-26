import { useRef } from 'react';

import { Button, Tooltip } from '@mui/material';
import { QRCodeCanvas } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router-dom';

import '@/styles/SurveyDetailsCss.css';
import '@/styles/complete.css';

import { useAbility } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { printQrCodePdf } from '@/utils/qrCodeUtils';
import { subject } from '@casl/ability';

import { useApi } from '@/hooks/useApi';

export default function SurveyDetails() {
	const { id } = useParams();
	const { surveyService } = useApi();
	const {
		data: survey,
		isLoading: loading
	} = surveyService.useSurveyWithUser(id) || {};
	const error = !loading && !survey;
	const navigate = useNavigate();
	const qrRefs = useRef<(HTMLDivElement | null)[]>([]);
	const ability = useAbility();

	// Check if user has permission to read this survey
	const canRead = survey
		? ability.can(ACTIONS.CASL.READ, subject(SUBJECTS.SURVEY, survey))
		: false;
	const canEdit = survey
		? ability.can(ACTIONS.CASL.UPDATE, subject(SUBJECTS.SURVEY, survey))
		: false;
	// Fields to display in survey responses section
	const displayFields = [
		'first_two_letters_fname',
		'first_two_letters_lname',
		'date_of_birth',
		'email_phone_consent',
		'email',
		'phone'
	];

	const labelMap: Record<string, string> = {
		first_two_letters_fname: 'First name initials',
		first_two_letters_lname: 'Last name initials',
		date_of_birth: 'Date of Birth',
		email_phone_consent: 'Email/Phone Consent',
		email: 'Email',
		phone: 'Phone'
	};

	if (loading) return <p>Loading...</p>;

	if (error || !survey || !canRead) {
		return (
			<div>
				<br />
				<br />
				<br />
				<div className="survey-details-container">
					<h2>Access Denied</h2>
					<p>
						You don't have permission to view this survey, or it
						doesn't exist.
					</p>
					<Button
						variant="contained"
						onClick={() => navigate('/survey-entries')}
						sx={{
							textTransform: 'none',
							backgroundColor: '#3E236E',
							'&:hover': { backgroundColor: '#5F2A96' },
							mt: 2
						}}
					>
						Back to Survey Entries
					</Button>
				</div>
			</div>
		);
	}

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
						<strong>Survey Code:</strong> {survey.surveyCode}
					</p>
					<p>
						<strong>Staff Name:</strong> {survey.employeeName}
					</p>
					<p>
						<strong>Location:</strong> {survey.locationName}
					</p>
					<p>
						<strong>Date and Time:</strong>{' '}
						{new Date(survey.createdAt).toLocaleString()}
					</p>
				</div>

				{/* Gift Card Information */}
				<div className="responses-section">
					<h3>Gift Card Information</h3>
					<pre>
						{survey.responses &&
							displayFields
								.filter(field => field in survey.responses)
								.map(field => {
									const answer = survey.responses[field];
									const label = labelMap[field] || field;
									return `${label}: ${answer ?? 'N/A'}`;
								})
								.join('\n\n')}
					</pre>
				</div>
				{/* Edit Pre-screen Questions Button */}
				<Tooltip
					title={
						!canEdit
							? "You don't have permission to edit this survey"
							: ''
					}
				>
					<span>
						<button
							className="edit-button"
							disabled={!canEdit}
							onClick={() => navigate(`/survey/${id}/edit`)}
						>
							Edit Gift Card Information
						</button>
					</span>
				</Tooltip>
				{/* Coupon Code Information */}
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
													{index + 1}. Coupon Code:{' '}
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
							Print Coupon Codes
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
