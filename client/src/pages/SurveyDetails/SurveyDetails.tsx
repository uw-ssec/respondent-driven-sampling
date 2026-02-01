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
	const navigate = useNavigate();
	const { surveyService, locationService } = useApi();
	const {
		data: survey,
		isLoading: surveyLoading,
		error: surveyError
	} = surveyService.useSurveyWithUser(id ?? '') || {};
	const {
		data: locations,
		isLoading: locationsLoading,
		error: locationsError
	} = locationService.useLocations() || {};

	const loading = surveyLoading || locationsLoading;
	const error = surveyError || locationsError || (!loading && !survey);

	// Find location name from locations
	const locationName =
		survey && locations
			? locations.find(loc => loc._id === survey.locationObjectId)?.hubName ||
			  'Unknown'
			: 'Unknown';
	const qrRefs = useRef<(HTMLDivElement | null)[]>([]);
	const ability = useAbility();

	// Check if user has permission to read this survey
	const canRead = survey
		? ability.can(ACTIONS.CASL.READ, subject(SUBJECTS.SURVEY, survey))
		: false;
	const canEdit = survey
		? ability.can(ACTIONS.CASL.UPDATE, subject(SUBJECTS.SURVEY, survey))
		: false;
	// Fields to display in survey details (top box)
	const surveyDetailsFields = [
		'first_two_letters_fname',
		'first_two_letters_lname',
		'date_of_birth'
	];

	// Fields to display in gift card information section
	const giftCardFields = [
		'email_phone_consent',
		'email',
		'phone',
		'gift_card_number',
		'gift_card_2'
	];

	const labelMap: Record<string, string> = {
		first_two_letters_fname: 'First name initials',
		first_two_letters_lname: 'Last name initials',
		date_of_birth: 'Date of Birth',
		survey_comments: 'Survey Comments',
		email_phone_consent: 'Email/Phone Consent',
		email: 'Email',
		phone: 'Phone',
		gift_card_number: 'Gift Card Number',
		gift_card_2: 'Gift Card 2'
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

				<div style={{ marginBottom: '20px' }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '10px'
						}}
					>
						<h3 style={{ margin: 0 }}>Survey Information</h3>
						{/* Edit Survey Details Button */}
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
									onClick={() =>
										navigate(`/survey/${id}/edit?mode=details`)
									}
								>
									Edit Survey Details
								</button>
							</span>
						</Tooltip>
					</div>
					<div className="survey-info">
						<p>
							<strong>Survey Code:</strong> {survey.surveyCode}
						</p>
						<p>
							<strong>Staff Name:</strong> {survey.employeeName}
						</p>
						<p>
							<strong>Location:</strong> {locationName}
						</p>
						<p>
							<strong>Date and Time:</strong>{' '}
							{new Date(survey.createdAt).toLocaleString()}
						</p>
						{survey.responses &&
							surveyDetailsFields
								.filter(field => field in survey.responses)
								.map((field, index) => {
									const answer = survey.responses[field];
									const label = labelMap[field] || field;
									return (
										<p key={index}>
											<strong>{label}:</strong>{' '}
											{answer ?? 'N/A'}
										</p>
									);
								})}
					</div>
				</div>

				{/* Gift Card Information */}
				<div style={{ marginBottom: '20px' }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '10px'
						}}
					>
						<h3 style={{ margin: 0 }}>Gift Card Information</h3>
						{/* Edit Gift Card Information Button */}
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
									onClick={() =>
										navigate(`/survey/${id}/edit?mode=giftcard`)
									}
								>
									Edit Gift Card Information
								</button>
							</span>
						</Tooltip>
					</div>
					<div className="survey-info">
						{survey.responses &&
							giftCardFields
								.filter(field => field in survey.responses)
								.map((field, index) => {
									const answer = survey.responses[field];
									const label = labelMap[field] || field;
									return (
										<p key={index}>
											<strong>{label}:</strong>{' '}
											{answer ?? 'N/A'}
										</p>
									);
								})}
					</div>
				</div>
				{/* Feedback Section */}
				<div style={{ marginBottom: '20px' }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '10px'
						}}
					>
						<h3 style={{ margin: 0 }}>Feedback</h3>
						{/* Leave Feedback Button */}
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
									onClick={() =>
										navigate(`/survey/${id}/edit?mode=feedback`)
									}
								>
									Leave Feedback
								</button>
							</span>
						</Tooltip>
					</div>
					<div className="survey-info">
						{survey.responses?.survey_comments ? (
							<p style={{ whiteSpace: 'pre-wrap' }}>
								<strong>Comments:</strong>{' '}
								{survey.responses.survey_comments}
							</p>
						) : (
							<p>
								<strong>Comments:</strong> No feedback provided
							</p>
						)}
					</div>
				</div>

				{/* Coupon Code Information */}
				<div style={{ marginBottom: '20px' }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: '10px'
						}}
					>
						<h3 style={{ margin: 0 }}>Referral Information</h3>
						<button className="generate-btn" onClick={handlePrint}>
							Print Coupon Codes
						</button>
					</div>
					<div className="referral-info">
						<p>
							<strong>Referred By Code:</strong>{' '}
							{survey.parentSurveyCode ?? 'N/A'}
						</p>

						<div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
							<p style={{ margin: 0 }}>
								<strong>Generated Referral Codes:</strong>
							</p>
							{survey.childSurveyCodes &&
							survey.childSurveyCodes.length > 0 ? (
								<ul className="referral-list" style={{ margin: 0 }}>
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
								<span>N/A</span>
							)}
						</div>
						{/* Display QR Codes */}
						<div className="print-area">
							<div
								className="qr-code-container"
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: '10px'
								}}
							>
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
													style={{
														display: 'inline-block',
														textAlign: 'center',
														padding: '5px'
													}}
												>
													<QRCodeCanvas
														value={qrSurveyCode}
														size={80}
														level="M"
													/>
													<p
														className="qr-code-text"
														style={{
															fontSize: '10px',
															margin: '5px 0 0 0'
														}}
													>
														{index + 1}. {code}
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
					</div>
				</div>
			</div>
		</div>
	);
}
