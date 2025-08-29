import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';

import 'survey-core/defaultV2.min.css';

import {
	getAuthToken,
	getEmployeeId,
	getFirstName
} from '@/utils/authTokenHandler';
import { useGeolocated } from 'react-geolocated';

import { LogoutProps } from '@/types/AuthProps';
import Header from '@/pages/Header/Header';

// This component is responsible for rendering the survey and handling its logic
// It uses the SurveyJS library to create and manage the survey
// It also handles referral code validation and geolocation
// It uses React Router for navigation and URL parameter handling
// It uses localStorage to persist data across sessions
// It uses the useEffect hook to manage side effects, such as fetching data and updating state
// It uses the useState hook to manage component state
// It uses the useGeolocated hook to get the user's geolocation
const SurveyComponent = ({ onLogout }: LogoutProps) => {
	const location = useLocation();
	const [employeeId, setEmployeeId] = useState(localStorage.getItem('employeeId'));
	const [employeeName, setEmployeeName] = useState(localStorage.getItem('firstName'));
	const [referredByCode, setReferredByCode] = useState<string | null>(location.state?.referralCode);
	const [isReferralValid, setIsReferralValid] = useState(true);
	localStorage.setItem('objectId', '');

	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const surveyRef = useRef<Model | null>(null);

	const { coords } = useGeolocated({
		positionOptions: {
			enableHighAccuracy: false
		},
		userDecisionTimeout: 5000
	});

	useEffect(() => {
		// 1) Load from localStorage
		const storedEmployeeId = getEmployeeId();
		const storedFirstName = getFirstName();
		if (storedEmployeeId) setEmployeeId(storedEmployeeId);
		if (storedFirstName) setEmployeeName(storedFirstName);

		// 2) Check if referral is passed via location.state
		const codeFromState = location.state?.referralCode;
		if (codeFromState) {
			setReferredByCode(codeFromState);
			validateReferralCode(codeFromState);
			return; // Skip reading from URL if we have it in state
		}

		// 3) Otherwise, check the URL query param "?ref=XXXX"
		const codeInUrl = searchParams.get('ref');
		if (codeInUrl) {
			setReferredByCode(codeInUrl);
			validateReferralCode(codeInUrl);
		}
	}, [location.state, searchParams]);

	async function validateReferralCode(code: string) {
		try {
			const token = getAuthToken();
			const response = await fetch(`/api/surveys/validate-ref/${code}`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!response.ok) {
				if (response.status == 401) {
					// Token Error, either expired or invalid for some other reason.
					// Log out user so they can relogin to generate a new valid token
					onLogout();
					navigate('/login');
					return;
				}
				const errData = await response.json();
				alert(
					errData.message ||
						'Invalid referral code. Please check again.'
				);
				setReferredByCode(null);
				setIsReferralValid(false);
			} else {
				setIsReferralValid(true);
			}
		} catch (error) {
			console.error('Error validating referral code:', error);
			setIsReferralValid(false);
		}
	}

	const surveyJson = useMemo(
		() => ({
			title: 'Homelessness Experience Survey',
			showProgressBar: 'top',
			progressBarType: 'buttons',
			pages: [
				// Pre-Screening Volunteer
				{
					name: 'pre-screen-1',
					title: 'Pre-Screening Questions - Volunteer Only',
					elements: [
						{
							type: 'html',
							name: 'pre-screen-note',
							html: '<div><strong>These questions are for volunteers only. Please do not ask the respondent!</strong></div>'
						},
						{
							type: 'dropdown',
							name: 'location',
							title: 'Please select location:',
							choices: ['Location X', 'Location Y', 'Location Z'],
							isRequired: true
						},
						{
							type: 'radiogroup',
							name: 'interpreter',
							title: 'Is respondent using interpreter?',
							choices: ['Yes', 'No'],
							isRequired: true
						},
						{
							type: 'text',
							name: 'language',
							title: 'If Yes - language spoken',
							visibleIf: "{interpreter} = 'Yes'",
							validators: [
								{
									type: 'regex',
									text: 'Language should not contain numbers.',
									regex: '^[A-Za-z ]+$'
								}
							]
						}
					]
				},
				// Pre-Screening Respondent
				{
					name: 'pre-screen-2',
					title: 'Pre-Screening Questions - Respondent',
					elements: [
						{
							type: 'html',
							name: 'respondent-pre-screening',
							html: '<div><strong>Please ask the following questions to the respondent.</strong></div>'
						},
						{
							type: 'text',
							name: 'phone_number',
							title: "Enter the respondent's phone number (123-456-7890)",
							validators: [
								{
									type: 'regex',
									text: 'Please enter a valid phone number.',
									regex: '^\\d{3}-\\d{3}-\\d{4}$'
								}
							]
						},
						{
							type: 'text',
							name: 'email',
							title: "Enter the respondent's email",
							validators: [
								{
									type: 'regex',
									text: 'Please enter a valid email address.',
									regex: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'
								}
							]
						},
						{
							type: 'radiogroup',
							name: 'email_consent',
							title: 'Can we email the respondent regarding survey results?',
							choices: ['Yes', 'No'],
							isRequired: true
						},
						{
							type: 'radiogroup',
							name: 'phone_consent',
							title: 'Can we message the respondent regarding survey results?',
							choices: ['Yes', 'No'],
							isRequired: true
						}
					]
				},
				{
					name: 'consent_page',
					title: 'Consent Confirmation',
					elements: [
						{
							type: 'html',
							name: 'consent-instructions',
							html: '<div><strong>Please ask the respondent if they are above the age of 18. The survey will end if they are not at least 18 years old.</strong></div>'
						},
						{
							type: 'radiogroup',
							name: 'age_for_consent',
							title: 'Is the respondent at least 18?',
							choices: ['Yes', 'No'],
							isRequired: true
						},
						{
							type: 'html',
							name: 'consent-note',
							html: `<div><strong>Please read the following consent information out loud to the respondent and have them orally give their consent to you:</strong></div>
        <p>Participation in research is voluntary. The decision to participate, or not participate, is entirely up to you. You have the right to decline to participate in, or withdraw from, this study at any point without penalty or loss of benefits to which you already receive or to which you are entitled.</p>
        <p>This study has been explained to me and I understand. I volunteer to take part in this research. I have had the opportunity to ask questions. If I have questions later about the research, or if I have been harmed by participating in this study, I can contact one of the researchers listed on the first page of this consent form. If I have questions about my rights as a research subject, I can call the Human Subjects Division at (206) 543-0098. I will receive a copy of this consent form.</p>
        <p><strong>Let the respondent know that the survey will end here if they do not give consent.</strong></p>`,
							visibleIf: "{age_for_consent} = 'Yes'"
						},
						{
							type: 'radiogroup',
							name: 'consent_given',
							title: 'Did the subject orally consent to participate?',
							choices: ['Yes', 'No'],
							isRequired: true,
							visibleIf: "{age_for_consent} = 'Yes'"
						}
					],
					triggers: [
						{
							type: 'complete',
							expression: "{age_for_consent} = 'No'"
						},
						{
							type: 'complete',
							expression: "{consent_given} = 'No'"
						}
					]
				},
				// Break Page
				{
					name: 'survey-break',
					title: 'Break Page',
					elements: [
						{
							type: 'html',
							name: 'break-message',
							html: '<div><h3>The survey starts after this page. Any question beyond this point is for the respondent to answer. HUD-required questions are marked with an asterisk (*).</h3></div>'
						}
					]
				},
				// Personal Info
				{
					name: 'personal_info',
					title: 'Personal Info',
					visibleIf:
						"{age_for_consent} = 'Yes' and {consent_given} = 'Yes'",
					elements: [
						{
							type: 'text',
							name: 'first_two_letters_fname',
							title: 'First Two Letters of First Name',
							validators: [
								{
									type: 'regex',
									text: 'Name should not contain numbers.',
									regex: '^[A-Za-z ]+$'
								}
							]
						},
						{
							type: 'text',
							name: 'first_two_letters_lname',
							title: 'First Two Letters of Last Name',
							validators: [
								{
									type: 'regex',
									text: 'Name should not contain numbers.',
									regex: '^[A-Za-z ]+$'
								}
							]
						},
						{
							type: 'text',
							name: 'year_born',
							title: 'Year born',
							validators: [
								{
									type: 'regex',
									text: 'Please enter a valid year.',
									regex: '^[0-9]+$'
								}
							]
						},
						{
							type: 'dropdown',
							name: 'month_born',
							title: 'Month born',
							choices: [
								'January',
								'February',
								'March',
								'April',
								'May',
								'June',
								'July',
								'August',
								'September',
								'October',
								'November',
								'December'
							]
						}
					]
				},
				// Network Module
				{
					name: 'network_questions',
					title: 'Network Module',
					visibleIf:
						"{age_for_consent} = 'Yes' and {consent_given} = 'Yes'",
					elements: [
						{
							type: 'text',
							name: 'non_family_network_size',
							title: 'Other than family living with you, how many people do you closely know who are also unhoused or experiencing homelessness today?',
							inputType: 'number',
							validators: [{ type: 'numeric', minValue: 0 }]
						},
						{
							type: 'paneldynamic',
							name: 'network_details',
							title: 'For those people, please fill in as much of the following information as you are able:',
							templateElements: [
								{
									type: 'text',
									name: 'name_pseudo',
									title: 'Name (pseudo or initials)'
								},
								{
									type: 'dropdown',
									name: 'relationship',
									title: 'Relationship',
									choices: [
										'Friend',
										'Acquaintance',
										'Partner',
										'Immediate family',
										'Extended family',
										'Neighbor'
									],
									hasOther: true
								},
								{
									type: 'dropdown',
									name: 'sleeping_situation',
									title: 'Where do they currently sleep?',
									choices: [
										'Outside, in a tent',
										'Outside, not in a tent',
										'Car/truck/van',
										'RV/trailer/boat',
										'Park',
										'Shelter',
										'Hotel/motel',
										'Abandoned building',
										'Public facility',
										'Tiny home',
										'Transit',
										'Jail/prison',
										'Hospital',
										'Treatment center',
										"Friend's home",
										'Deceased',
										'Do not know',
										'Choose not to answer'
									],
									hasOther: true
								}
							],
							panelAddText: 'Add another person',
							panelRemoveText: 'Remove this person'
						}
					]
				},
				// HUD Module – History and Living Situation
				{
					name: 'hud_history',
					title: 'HUD Module – History and Living Situation',
					visibleIf:
						"{age_for_consent} = 'Yes' and {consent_given} = 'Yes'",
					elements: [
						{
							type: 'dropdown',
							name: 'sleeping_situation',
							title: 'Where did you stay last night?',
							choices: [
								'Outside, in a tent',
								'Outside, not in a tent',
								'Car/truck/van',
								'RV/trailer/boat',
								'Park',
								'Shelter',
								'Hotel/motel',
								'Abandoned building',
								'Public facility',
								'Tiny home',
								'Transit',
								'Jail/prison',
								'Hospital',
								'Treatment center',
								"Friend's home",
								'Deceased',
								'Do not know',
								'Choose not to answer'
							],
							hasOther: true
						},
						{
							type: 'dropdown',
							name: 'vehicle_amenities',
							title: 'Does your vehicle have access to any of the following needs?',
							choices: [
								'Electricity',
								'Water',
								'Heat',
								'None',
								'Other'
							],
							hasOther: true
						},
						{
							type: 'dropdown',
							name: 'personal_amenities',
							title: 'Do you generally have access to the following basic needs?',
							choices: [
								'Food',
								'Water',
								'Shower',
								'Laundry',
								'None',
								'Other'
							],
							hasOther: true
						},
						{
							type: 'dropdown',
							name: 'episode_lot_homeless',
							title: 'How long have you been homeless this time?',
							choices: [
								'1 night',
								'2-6 nights',
								'1 week or more',
								'1 month or more',
								'90 days or more',
								'1 year or longer',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'dropdown',
							name: 'num_episodes',
							title: 'Including this time, how many different times have you been homeless in the past 3 years?',
							choices: [
								'1',
								'2',
								'3',
								'4',
								'5 or more',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'panel',
							name: 'overall_lot_homeless',
							title: 'Total time spent homeless in past 3 years',
							elements: [
								{
									type: 'text',
									name: 'years',
									title: 'Years',
									inputType: 'number'
								},
								{
									type: 'text',
									name: 'months',
									title: 'Months',
									inputType: 'number'
								},
								{
									type: 'text',
									name: 'weeks',
									title: 'Weeks',
									inputType: 'number'
								},
								{
									type: 'text',
									name: 'days',
									title: 'Days',
									inputType: 'number'
								}
							]
						},
						{
							type: 'dropdown',
							name: 'shelter_svcs',
							title: 'In the past 3 years, have you enrolled in an Emergency Shelter or received any other form of housing assistance?',
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'paneldynamic',
							name: 'shelter_svcs_details',
							title: 'If yes, please provide details:',
							visibleIf: "{shelter_svcs} = 'Yes'",
							templateElements: [
								{
									type: 'text',
									name: 'shelter_svcs_date',
									title: 'Date (MM/YYYY)'
								},
								{
									type: 'dropdown',
									name: 'shelter_svcs_type',
									title: 'Type',
									choices: [
										'Referral',
										'Voucher',
										'Hygiene support',
										'Other'
									],
									hasOther: true
								},
								{
									type: 'text',
									name: 'shelter_svcs_provider',
									title: 'Provider'
								}
							]
						}
					]
				},
				// Demographics
				{
					name: 'demographics',
					title: 'Demographics',
					visibleIf:
						"{age_for_consent} = 'Yes' and {consent_given} = 'Yes'",
					elements: [
						{
							type: 'dropdown',
							name: 'age_group',
							title: 'How old are you?',
							isRequired: true,
							choices: [
								'18-24',
								'25-34',
								'35-44',
								'45-54',
								'55-64',
								'65 or older',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'checkbox',
							name: 'gender_id',
							title: 'Which of the following best describes your gender? (Select all that apply)',
							isRequired: true,
							choices: [
								'Woman (girl if child)',
								'Man (boy if child)',
								'Culture specific identity',
								'Transgender',
								'Non-binary',
								'Questioning',
								'Different identity',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'dropdown',
							name: 'ethnicity',
							title: 'Are you Hispanic/Latina/e/o?',
							isRequired: true,
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'checkbox',
							name: 'racial_id',
							title: 'Which of the following best describes your racial identity? (Select all that apply)',
							isRequired: true,
							choices: [
								'American Indian, Alaskan Native or Indigenous',
								'Asian or Asian American',
								'Black, African American or African',
								'Hispanic/Latina/e/o',
								'Middle Eastern or North African',
								'Native Hawaiian or Pacific Islander',
								'White',
								'Other',
								'Choose not to answer',
								'Do not know'
							],
							hasOther: true
						},
						{
							type: 'dropdown',
							name: 'tribal_affil',
							title: 'Do you have a Tribal Affiliation? If so, what is it?',

							choices: [
								'No',
								'Yes (please specify below)',
								'Choose not to answer',
								'Do not know'
							],
							hasOther: true
						},
						{
							type: 'dropdown',
							name: 'veteran_status',
							title: 'Are you or a member of your immediate family a veteran?',
							isRequired: true,
							choices: [
								'Yes, I am',
								'Yes, a member of my immediate family is a veteran',
								'Yes, both',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'dropdown',
							name: 'va_health_eligible',
							title: 'Have you ever received health care or other benefits from a Veterans Administration (VA) center?',
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						}
					]
				},
				// Medical/Disability Module
				{
					name: 'medical',
					title: 'Medical/Disability Module',
					visibleIf:
						"{age_for_consent} = 'Yes' and {consent_given} = 'Yes'",
					elements: [
						{
							type: 'dropdown',
							name: 'fleeing_dv',
							title: 'Are you currently experiencing homelessness because you are/were fleeing domestic violence, dating violence, sexual assault, or stalking?',
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'dropdown',
							name: 'disabled',
							title: 'Do you identify as having a disability?',
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'dropdown',
							name: 'mental_health',
							title: 'Do you identify as having a severe mental illness?',
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'dropdown',
							name: 'substance_use',
							title: 'Do you identify as having a substance use disorder?',
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						}
					]
				},
				// Household Module
				{
					name: 'household',
					title: 'Household Information',
					visibleIf:
						"{age_for_consent} = 'Yes' and {consent_given} = 'Yes'",
					elements: [
						{
							type: 'paneldynamic',
							name: 'household_members',
							title: 'List the initials of all the people in your household (anyone who shares the same dwelling with you)',
							templateElements: [
								{
									type: 'text',
									name: 'hh_member_initials',
									title: 'Initials'
								},
								{
									type: 'dropdown',
									name: 'hh_member_relation',
									title: 'Relationship',
									choices: [
										'Parent/legal guardian',
										'Other adult family member',
										'Sibling',
										'My own child',
										'Spouse',
										'Non-married partner',
										'Other non-family member'
									]
								},
								{
									type: 'dropdown',
									name: 'hh_member_age',
									title: 'Age',
									choices: ['Younger than 18', '18-24', '25+']
								},
								{
									type: 'checkbox',
									name: 'hh_member_gender_id',
									title: 'Gender (Select all that apply)',
									choices: [
										'Woman (girl if child)',
										'Man (boy if child)',
										'Culture specific identity',
										'Transgender',
										'Non-binary',
										'Questioning',
										'Different identity',
										'Choose not to answer',
										'Do not know'
									]
								},
								{
									type: 'dropdown',
									name: 'hh_member_ethnicity',
									title: 'Are they Hispanic/Latina/e/o?',
									choices: [
										'Yes',
										'No',
										'Choose not to answer',
										'Do not know'
									]
								},
								{
									type: 'checkbox',
									name: 'hh_member_racial_id',
									title: 'Race (Select all that apply)',
									choices: [
										'American Indian, Alaskan Native or Indigenous',
										'Asian or Asian American',
										'Black, African American or African',
										'Hispanic/Latina/e/o',
										'Middle Eastern or North African',
										'Native Hawaiian or Pacific Islander',
										'White',
										'Other',
										'Choose not to answer',
										'Do not know'
									],
									hasOther: true
								},
								{
									type: 'dropdown',
									name: 'hh_member_tribal_id',
									title: 'Tribal affiliation',
									choices: [
										'No',
										'Yes (please specify below)',
										'Choose not to answer',
										'Do not know'
									],
									hasOther: true
								},
								{
									type: 'dropdown',
									name: 'hh_member_vet_status',
									title: 'Are they a veteran?',
									choices: [
										'Yes',
										'No',
										'Choose not to answer',
										'Do not know'
									]
								},
								{
									type: 'dropdown',
									name: 'hh_member_disability',
									title: 'Do they identify as having a disability?',
									choices: [
										'Yes',
										'No',
										'Choose not to answer',
										'Do not know'
									]
								},
								{
									type: 'dropdown',
									name: 'hh_member_smi',
									title: 'Do they identify as having a severe mental illness?',
									choices: [
										'Yes',
										'No',
										'Choose not to answer',
										'Do not know'
									]
								},
								{
									type: 'dropdown',
									name: 'hh_member_sud',
									title: 'Do they identify as having a substance use disorder?',
									choices: [
										'Yes',
										'No',
										'Choose not to answer',
										'Do not know'
									]
								}
							],
							panelAddText: 'Add another household member',
							panelRemoveText: 'Remove this household member'
						}
					]
				},
				// Mobility/Resource Module
				{
					name: 'mobility_resource',
					title: 'Mobility/Resource Module',
					visibleIf:
						"{age_for_consent} = 'Yes' and {consent_given} = 'Yes'",
					elements: [
						{
							type: 'text',
							name: 'place_of_origin',
							title: 'Where did you travel from today? (Town or City)'
						},
						{
							type: 'checkbox',
							name: 'mode_of_transpo',
							title: 'What transportation did you use to come to the hub today? (Check all that apply)',
							choices: [
								'Bus',
								'Link light rail',
								'Ferry',
								'Car',
								'Bicycle/Bike',
								'Walking'
							],
							hasOther: true
						},
						{
							type: 'panel',
							name: 'travel_time',
							title: 'How long did it take you to travel here today?',
							elements: [
								{
									type: 'text',
									name: 'travel_time_hours',
									title: 'Hours',
									inputType: 'number'
								},
								{
									type: 'text',
									name: 'travel_time_minutes',
									title: 'Minutes',
									inputType: 'number'
								}
							]
						},
						{
							type: 'dropdown',
							name: 'travel_dist',
							title: 'About how many miles did you travel to get here today?',
							choices: [
								'<0.5',
								'<1',
								'1-5',
								'6-10',
								'11-20',
								'21-50',
								'51-100',
								'100+',
								'Other'
							],
							hasOther: true
						},
						{
							type: 'dropdown',
							name: 'refugee_status',
							title: 'Are you a refugee or seeking asylum in the United States?',
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'text',
							name: 'last_stable_loc',
							title: 'Where did you live the last time you had stable housing such as an apartment or a house?'
						},
						{
							type: 'dropdown',
							name: 'age_first_hmlss',
							title: 'How old were you the first time you experienced homelessness?',
							choices: [
								'0-17',
								'18-24',
								'25-34',
								'35-44',
								'45-54',
								'55-64',
								'65 or older',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'dropdown',
							name: 'pet_animal',
							title: 'Do you have a pet or animal companion?',
							choices: [
								'Yes',
								'No',
								'Choose not to answer',
								'Do not know'
							]
						},
						{
							type: 'panel',
							name: 'pet_details',
							title: 'Pet Details',
							visibleIf: "{pet_animal} = 'Yes'",
							elements: [
								{
									type: 'text',
									name: 'pet_type_species',
									title: 'Type/species'
								},
								{
									type: 'text',
									name: 'pet_age_est',
									title: 'Age (estimate)',
									inputType: 'number'
								},
								{
									type: 'text',
									name: 'pet_medical_needs',
									title: 'Medical needs'
								}
							]
						}
					]
				},
				// Events/Conditions Module
				{
					name: 'events_conditions',
					title: 'Events/Conditions Module',
					visibleIf:
						"{age_for_consent} = 'Yes' and {consent_given} = 'Yes'",
					elements: [
						{
							type: 'checkbox',
							name: 'precipitating_events',
							title: 'What events or conditions contributed to your experience of homelessness? (Select all that apply)',
							choices: [
								'Lost job',
								'Eviction',
								'Foreclosure',
								'Incarceration/detention',
								'Illness/medical problem',
								'Mental health issues',
								'Hospitalization/treatment',
								'Divorce/separation/breakup',
								'Could not afford rent increase',
								'Argument with family/friend/roommate',
								'Family domestic violence',
								"Family/friend's housing wouldn't let me stay",
								"Family/friend couldn't afford to let me stay",
								'Safety',
								'Resettlement transition',
								'Aging out of foster care',
								'Death of a parent/spouse/child',
								'Other',
								'Do not know',
								'Choose not to answer'
							],
							hasOther: true
						},
						{
							type: 'checkbox',
							name: 'shelter_priorities',
							title: 'If you were to seek out a shelter program, what top shelter features would be most important to you? (Select up to 5)',
							choices: [
								'Ease of access/enrollment',
								'Close to where I stay now/In my current community',
								'Enough space to keep my distance from others',
								'Clean facilities free of germs/illness',
								'Ability to store my belongings',
								'Ability to bring my pet/service animal',
								'Ability to bring my partner',
								'Ability to move in with a friend',
								'Minimal rules so I can do as I please',
								'Culturally specific services',
								'Meals provided daily',
								'A private room',
								"Ability to return if I don't stay there one night",
								'Support to find permanent housing',
								'Support for decreasing substance use',
								'Support for mental health conditions',
								'On-site health services such as a nurse',
								'Other'
							],
							hasOther: true
						}
					]
				}
			]
		}),
		[]
	);

	// INITIALIZE SURVEY + EVENTS
	useEffect(() => {
		const pushHistoryState = (pageNo: number) => {
			const currentState = window.history.state;
			if (!currentState || currentState.pageNo !== pageNo) {
				window.history.pushState(
					{ pageNo },
					'',
					window.location.pathname
				);
			}
		};

		const survey = new Model(surveyJson);
		surveyRef.current = survey;

		pushHistoryState(survey.currentPageNo);

		survey.onCurrentPageChanged.add(async sender => {
			const currentPageNo = sender.currentPageNo;
			pushHistoryState(currentPageNo);


			// EXAMPLE FETCH FOR AUTOSAVE - this pings every page change

			/*const surveyData = {
				responses: sender.data || {},
				referredByCode: isReferralValid ? referredByCode : null,
				coords: coords || { latitude: 0, longitude: 0 }, 
				objectId: localStorage.getItem('objectId')
			};

			try {
				//console.log('Survey Data Being Sent:', surveyData); // Should we be printing survey data?
				const token = getAuthToken();
				const response = await fetch('/api/surveys/autosave', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify(surveyData)
				});

				if (response.ok) {
					const data = await response.json();
					console.log('Survey autosaved successfully!', data);
					localStorage.setItem('objectId', data.objectId);
				} else if (response.status == 401) {
					// Token Error, either expired or invalid for some other reason.
					// Log user out so they can relogin to generate a new valid token
					onLogout();
					navigate('/login');
					return;
				} else {
					console.error(
						'Error saving survey:',
						await response.text()
					);
				}
			} catch (error) {
				console.error('Request failed:', error);
			}*/
		});

		survey.onComplete.add(async sender => {
			const surveyData = {
				responses: sender.data || {},
				referredByCode: isReferralValid ? referredByCode : null,
				coords: coords || { latitude: 0, longitude: 0 }, 
				objectId: localStorage.getItem('objectId')
			};

			console.log('Survey Submitted:', surveyData);

			try {
				console.log('Survey Data Being Sent:', surveyData); // Should we be printing survey data?
				const token = getAuthToken();
				const response = await fetch('/api/surveys/submit', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify(surveyData)
				});

				if (response.ok) {
					const data = await response.json();
					console.log('Survey saved successfully!', data);

					navigate('/qrcode', {
						state: { referralCodes: data.referralCodes }
					});
				} else if (response.status == 401) {
					// Token Error, either expired or invalid for some other reason.
					// Log user out so they can relogin to generate a new valid token
					onLogout();
					navigate('/login');
					return;
				} else {
					console.error(
						'Error saving survey:',
						await response.text()
					);
				}
			} catch (error) {
				console.error('Request failed:', error);
			}
		});
	}, [
		employeeId,
		employeeName,
		isReferralValid,
		referredByCode,
		coords,
		navigate,
		surveyJson
	]);

	// BACK BUTTON BEHAVIOR
	useEffect(() => {
		const handlePopState = (event: { state: { pageNo: any } }) => {
			const survey = surveyRef.current;
			if (!survey) return;

			const currentPageNo = survey.currentPageNo;
			const targetPageNo = event.state?.pageNo;

			if (typeof targetPageNo !== 'number') return; // prevent invalid jumps

			if (targetPageNo < currentPageNo) {
				survey.prevPage();
			} else if (targetPageNo > currentPageNo) {
				survey.nextPage();
			}
		};

		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	// RENDER COMPONENT
	return (
		<>
			<Header onLogout={onLogout} />
			<div style={{ padding: '20px' }}>
				{surveyRef.current && <Survey model={surveyRef.current} />}

				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						gap: '24px',
						marginTop: '12px'
					}}
				>
					<div
						onClick={() => {
							if (
								surveyRef.current &&
								surveyRef.current.currentPageNo > 0
							) {
								surveyRef.current.prevPage();
							}
						}}
						style={{ cursor: 'pointer' }}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="36px"
							height="36px"
						>
							<circle cx="12" cy="12" r="10" fill="#3E236E" />
							<path
								d="M14 7l-5 5 5 5"
								stroke="white"
								strokeWidth="2"
								fill="none"
							/>
						</svg>
					</div>
					<div
						onClick={() => {
							if (
								surveyRef.current &&
								!surveyRef.current.isLastPage
							) {
								surveyRef.current.nextPage();
							}
						}}
						style={{ cursor: 'pointer' }}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							width="36px"
							height="36px"
						>
							<circle cx="12" cy="12" r="10" fill="#3E236E" />
							<path
								d="M10 7l5 5-5 5"
								stroke="white"
								strokeWidth="2"
								fill="none"
							/>
						</svg>
					</div>
				</div>
			</div>
		</>
	);
};

export default SurveyComponent;
