

type Choice =
	| string
	| {
			value: string;
			text: string;
	  };

export const generateSurveyJson = (locations: Choice[]) => {
	const preScreenPage = generateVolunteerPreScreenPage(locations);

	return {
		title: 'Homelessness Experience Survey',
		showProgressBar: true,
		progressBarLocation: 'top',
		progressBarShowPageTitles: true,
		pages: [
			preScreenPage,
			consentPage,
			surveyValidationPage,
			personalLivingSituationPage,
			networkPage1,
			networkPage2,
			durationHomelessnessPage,
			shelterServicesPage,
			demographicsPage,
			healthPage,
			householdPage,
			specialQuestionsPage,
			surveyDeduplicationPage,
			giftCardPage,
			outroPage
		],
		triggers: [
			{
				type: 'complete',
				expression: "{consent_given} = 'No' or {is_adult} = 'No'"
			}
		],
		partialSendEnabled: true
	};
};

export const generateEditSurveyJson = (locationChoices: Choice[]) => {
	const preScreenPage = generateVolunteerPreScreenPage(locationChoices);

	return {
		title: 'Homelessness Experience Survey (Edit Mode)',
		showProgressBar: 'top',
		progressBarType: 'buttons',
		pages: [preScreenPage, consentPage, surveyValidationPage]
	};
};

// PRE-SCREENING
const generateVolunteerPreScreenPage = (locationChoices: Choice[]) => {
	return {
		name: 'volunteer-pre-screen',
		title: 'Pre-Screening Questions - Volunteer Only',
		elements: [
			{
				type: 'html',
				name: 'question3',
				html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>Instructions:</strong> These questions are for volunteers only. Please do not ask the respondent.</div>'
			},
			{
				type: 'dropdown',
				name: 'location',
				title: 'Please select location:',
				choices: locationChoices,
				isRequired: true,
				showNoneItem: true
			}
		]
	};
};

const sleepingSituationChoices = [
	{
		value: 'outside_in_tent',
		text: 'Outside in a tent (or tent-like structure)'
	},
	{ value: 'outside_no_tent', text: 'Outside, not in a tent' },
	{
		value: 'small_vehicle',
		text: 'In a car, truck, or van (smaller vehicle)'
	},
	{
		value: 'large_vehicle',
		text: 'In an RV, trailer, or bus/boat (larger vehicle)'
	},
	{ value: 'park', text: 'In a park (uncovered, like on a bench)' },
	{
		value: 'shelter',
		text: 'In an overnight shelter (e.g. mission, church, resource shelter, etc.)'
	},
	{ value: 'hotel', text: 'In a hotel or motel' },
	{
		value: 'abandoned_building',
		text: 'In an abandoned building/backyard or storage structure'
	},
	{
		value: 'public_facility',
		text: 'In a public facility or transit (bus/train station, transit center, airport, hopsital waiting room)'
	},
	{ value: 'tiny_home', text: 'In a tiny home' },
	{
		value: 'public_transit',
		text: 'On public transit (e.g. slept on bus, train, etc.)'
	},
	{ value: 'jail', text: 'In jail or prison' },
	{
		value: 'hospital',
		text: 'In a hopsital (stayed as a patient overnight)'
	},
	{
		value: 'drug_alcohol_treatment',
		text: 'In a drug or alcohol treatment/detox center'
	},
	{
		value: 'friend_family',
		text: "In a friend or family member's house/apartment"
	},
	{ value: 'choose_not_to_answer', text: 'Choose not to answer' },
	{ value: 'do_not_know', text: 'Do not know' }
];

// INTRO
const consentPage = {
	name: 'consent',
	title: 'Consent Confirmation',
	elements: [
		{
			type: 'html',
			name: 'consent-note',
			html: `<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;">
				<strong>Instructions:</strong> Please read the following consent information out loud to the respondent and have them orally give their consent to you.
			</div>
			<br />
			<p>
				As part of work with the <strong>University of Washington</strong> in preparation for
				<strong>King County Regional Homelessness Authority (KCRHA) 2026 PIT Count</strong>,
				I'd like to ask you some questions we're required to ask and collect for <strong>KCRHA's</strong>
				funders about unsheltered homelessness in our region.
			</p>
			<p>
				Your participation is voluntary and will not affect any services you or your family are seeking or currently receiving.
				We are surveying many people and will put all responses together, so it will not be possible to identify you
				from the information you provide here.
			</p>
			<p>
				As a token of appreciation for your time, we will give you a <strong>$20 pre-loaded debit card</strong>.
			</p>
			<p>
				Would you be willing to talk with me for about <strong>30 minutes</strong>?
			</p>`
		},
		{
			type: 'radiogroup',
			name: 'consent_given',
			title: 'Do you consent to participate in this survey?',
			choices: ['Yes', 'No'],
			isRequired: true
		},
		{
			type: 'radiogroup',
			name: 'is_adult',
			title: 'Are you 18 years old or older?',
			choices: ['Yes', 'No'],
			isRequired: true
		}
	]
};

// SECTION 1.0
// SECTION 1.1
const surveyValidationPage = {
	name: 'survey-validation',
	title: 'Survey Validation',
	elements: [
		{
			type: 'text',
			name: 'first_two_letters_fname',
			title: "Enter the first two letters of the respondent's first name",
			validators: [
				{
					type: 'regex',
					text: "Please enter the first two letters of the respondent's first name.",
					regex: '^[A-Za-z]{2}$'
				}
			]
		},
		{
			type: 'text',
			name: 'first_two_letters_lname',
			title: "Enter the first two letters of the respondent's last name",
			validators: [
				{
					type: 'regex',
					text: "Please enter the first two letters of the respondent's last name.",
					regex: '^[A-Za-z]{2}$'
				}
			]
		},
		{
			type: 'text',
			name: 'date_of_birth',
			title: "Enter the respondent's date of birth",
			inputType: 'date',
			minValueExpression: "today(-36525)",  // 100 years ago (accounting for leap years)
 			maxValueExpression: "today(-6574)"     // 18 years ago (accounting for leap years)
		}
	]
};
// SECTION 1.2
const giftCardPage = {
	name: 'giftCards',
	title: 'Gift Cards',
	elements: [
		{
			type: 'html',
			name: 'referral_instruction',
			html: `<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;">
				<strong>Instructions:</strong> Please read the following information out loud to the respondent.
			</div>
			<br />
			<p>
				At the end of this survey, we will give you <strong>referral coupons</strong>.
				Please give them to other people experiencing homelessness.
				If they come and take our survey using your coupon, we can send you <strong>$5 gift cards</strong> for each completed referral.
				To receive these gift cards, we need either a <strong>phone number or email address</strong>.
			</p>`
		},
		{
			type: 'checkbox',
			name: 'email_phone_consent',
			title: 'Do you consent to receive your gift cards via SMS or email?',
			choices: [
				{
					value: 'email',
					text: 'Email address'
				},
				{
					value: 'phone',
					text: 'Phone number'
				}
			],
			showNoneItem: true
		},
		{
			type: 'text',
			name: 'email',
			visibleIf: "{email_phone_consent} contains 'email'",
			title: "What's your email address?",
			inputType: 'email'
		},
		{
			type: 'text',
			name: 'phone',
			visibleIf: "{email_phone_consent} contains 'phone'",
			title: "What's your phone number?",
			maskType: 'pattern',
			maskSettings: {
			  pattern: '+1(999)-999-99-99'
			}
		}
	]
};

// SECTION 2.0
const personalLivingSituationPage = {
	name: 'personal_living_situation',
	title: 'Personal Living Situation',
	elements: [
		{
			type: 'dropdown',
			name: 'sleeping_situation',
			title: 'Where did you stay last night?',
			choices: sleepingSituationChoices,
			showOtherItem: true,
			otherText: 'Other (please specify)',
			isRequired: false
		},
		{
			type: 'checkbox',
			name: 'vehicle_amenities',
			title: 'Does your vehicle have access to any of the following needs?',
			choices: [
				'Drinking water',
				'Restroom/Toilet',
				'Heat and/or Cooling',
				'Ability to bathe',
				'Ability to cook hot food'
			],
			showNoneItem: true,
			separateSpecialChoices: true,
			isRequired: false,
			visibleIf:
				"{sleeping_situation} anyof ['small_vehicle', 'large_vehicle']"
		},
		{
			type: 'checkbox',
			name: 'personal_amenities',
			title: 'Do you generally have access to any of the following needs?',
			choices: [
				'Drinking water',
				'Restroom/Toilet',
				'Heat and/or Cooling',
				'Ability to bathe',
				'Ability to cook hot food'
			],
			showNoneItem: true,
			isRequired: false,
			visibleIf: "{sleeping_situation} notempty and !({sleeping_situation} anyof ['small_vehicle', 'large_vehicle', 'choose_not_to_answer', 'do_not_know'])"
		}
	]
};

// SECTION 3.0
const networkPage1 = {
	name: 'network_questions_p1',
	title: 'Network Module',
	elements: [
		{
			type: 'text',
			name: 'non_family_network_size',
			title: 'Other than any family living with you, how many people do you closely know who are also unhoused or experiencing homelessness today?',
		inputType: 'number',
		validators: [{ type: 'numeric', minValue: 0, maxValue: 100 }]
	}
	]
};

const networkPage2 = {
	name: 'network_questions_p2',
	title: 'Network Module',
	elements: [
		{
			type: 'html',
			name: 'network_instruction',
			html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>Instructions:</strong> Please fill in information for each person below. You can add or remove tabs as needed.</div>'
		},
		{
			type: 'paneldynamic',
			name: 'non_family_network',
			title: 'Outside of your family living with you, please list the first name, pseudonym/nickname/street name or initials of the person and their relation (e.g. friend, family, etc) of people you personally know who are unhoused or experiencing homelessness. \nPlease answer for as many people as you know.',
			templateElements: [
				{
					type: 'text',
					name: 'network_person_name',
					title: 'Name/Nickname/Initials',
					placeholder: 'Name or nickname'
				},
				{
					type: 'dropdown',
					name: 'relationship',
					title: 'What is your relationship to {panel.network_person_name}?',
					choices: [
						'Friend',
						'Acquaintance',
						'Partner (husband/wife, fiancé/fiancée, boyfriend/girlfriend, etc.)',
						'Immediate family (parent/father/mother, sibling/brother/sister, child/son/daughter)',
						'Extended family (cousin, nephew/niece, uncle/aunt, grandparent/grandfather/grandmother)',
						'Neighbor (people you live near)'
					],
					showOtherItem: true,
					otherText: 'Other (please specify)',
					placeholder: 'Select relationship...'
				},
				{
					type: 'dropdown',
					name: 'network_sleeping_situation',
					title: 'Where does {panel.network_person_name} currently sleep?',
					choices: sleepingSituationChoices,
					showOtherItem: true,
					otherText: 'Other (please specify)'
				}
			],
			displayMode: 'tab',
			maxPanelCount: 50,
			panelAddText: '+ Add new person',
			panelRemoveText: 'Remove',
			templateTitle: 'Person: {panel.network_person_name}'
		}
	]
};

const durationHomelessnessPage = {
	name: 'duration_homelessness',
	title: 'Duration of Homelessness',
	elements: [
		{
			type: 'radiogroup',
			name: 'episode_lot_homeless',
			title: 'How long have you been homeless this time?',
			choices: [
				'1 night or less',
				'2-6 nights',
				'1 week or more, but less than 1 month',
				'1 month or more, but less than 90 days',
				'90 days or more, but less than 1 year',
				'1 year or longer',
				'Choose not to answer',
				'Do not know'
			],
			isRequired: false
		},
		{
			type: 'radiogroup',
			name: 'num_episodes',
			title: 'Including this time, how many different times have you been homeless in the past 3 years, that is since November 2022?',
			choices: [
				'1 time',
				'2 times',
				'3 times',
				'4 or more times',
				'Choose not to answer',
				'Do not know'
			],
			isRequired: false
		},
		{
			type: 'multipletext',
			name: 'overall_lot_homeless',
			title: 'If you added up all the time you have spent experiencing homelessness in the past 3 years, about how long would that be?',
			description: "Feel free to enter any variations of the respondent's answer. For example: 1.5 years, 18 months, 1 year and 6 months.",
			items: [
				{
					name: 'overall_lot_homeless_days',
					inputType: 'number',
					title: 'Years'
				},
				{
					name: 'overall_lot_homeless_months',
					inputType: 'number',
					title: 'Months'
				},
				{
					name: 'overall_lot_homeless_years',
					inputType: 'number',
					title: 'Days'
				}
			]
		}
	]
};

// Housing Assistance Services
const shelterServicesPage = {
	name: 'shelter_services_panel',
	title: 'Housing Assistance Services',
	elements: [
		{
			type: 'radiogroup',
			name: 'shelter_services',
			title: 'In the past 3 years, have you enrolled in an Emergency Shelter or received any other form of housing assistance from an organization that serves people experiencing homelessness? (Includes referrals, vouchers, hygiene support, etc.)',
			choices: [
				'Yes',
				'No',
				'Choose not to answer',
				'Do not know'
			]
		},
		{
			type: 'matrixdynamic',
			name: 'shelter_services_details',
			visibleIf: "{shelter_services} = 'Yes'",
			title: 'Housing Assistance Services',
			description: 'Fill out the table below as much as possible.\\nIn case a respondent received a service multiple times, only include the last service received.',
			validators: [
				{
					type: 'expression'
				}
			],
			columns: [
				{
					name: 'shelter_service_type',
					title: 'Type  of Last Service Received',
					cellType: 'dropdown',
					choices: [
						{
							value: '1',
							text: 'Street Outreach'
						},
						{
							value: '2',
							text: 'Diversion'
						},
						{
							value: '3',
							text: 'Emergency Shelter'
						},
						{
							value: '4',
							text: 'Temporary Housing'
						},
						{
							value: '5',
							text: 'Coordinated Entry'
						},
						{
							value: '6',
							text: 'Severe Weather Shelter'
						},
						{
							value: '7',
							text: 'Day Center'
						},
						{
							value: '8',
							text: 'Food bank'
						},
						{
							value: '9',
							text: 'Case Management'
						}
					],
					showOtherItem: true
				},
				{
					name: 'shelter_service_year',
					title: 'Date of Service Received (Month/Year)',
					cellType: 'text',
					maskType: 'datetime',
					maskSettings: {
						pattern: 'mm/yyyy',
						min: '1950-01-01',
						max: '2025-12-15'
					}
				}
			],
			choices: [
				'Street Outreach',
				'Diversion',
				'Emergency Shelter',
				'Temporary Housing',
				'Coordinated Entry',
				'Severe Weather Shelter ',
				'Day Center',
				'Food bank',
				'Case Management'
			],
			rowCount: 3,
			addRowText: 'Add Service',
			removeRowText: 'Remove'
		}
	]
};

// TODO
// const sexChoices = [
//     'Female',
//     'Male',
//     'Choose not to answer',
//     'Do not know'
// ]

const genderChoices = [
	'Woman (Girl if child)',
	'Man (Boy if child)',
	'Culturally Specific Identity (e.g., Two-spirit)',
	'Transgender',
	'Non-binary',
	'Questioning',
	'Different identity',
	'Choose not to answer',
	'Do not know'
];


// Updated US census standards
// https://www.census.gov/about/our-research/race-ethnicity/standards-updates.html
// https://www.federalregister.gov/documents/2024/03/29/2024-06469/revisions-to-ombs-statistical-policy-directive-no-15-standards-for-maintaining-collecting-and
const raceChoices = [
	'American Indian or Alaska Native',
	'Asian',
	'Black or African American',
	'Hispanic or Latino',
	'Middle Eastern or North African',
	'Native Hawaiian or Pacific Islander',
	'White',
	'Choose not to answer',
	'Do not know'
];

// SECTION 3.1
const demographicsPage = {
	name: 'demographics',
	title: 'Demographics',
	elements: [
		{
			type: 'html',
			name: 'demographics_instruction',
			html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>INTERVIEWER: Because the respondent has already indicated they are under 18, you may select 0-17 without asking this question.</strong></div>',
			visibleIf: "{is_adult} = 'No'"
		},
		{
			type: 'radiogroup',
			name: 'age_group',
			title: 'How old are you?',
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
			],
			isRequired: false
		},
		{
			type: 'checkbox',
			name: 'gender_id',
			title: 'Which of the following best describes your gender? (Select all that apply)',
			choices: genderChoices,
			isRequired: false,
			showOtherItem: true,
			otherText: 'Other (please specify)'
		},
		{
			type: 'radiogroup',
			name: 'ethnicity',
			title: 'Are you Hispanic/ Latina/e/o?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: false,
			visible: false
		},
		{
			type: 'checkbox',
			name: 'racial_id',
			title: 'Which of the following best describes your racial identity? (Select all that apply)',
			choices: raceChoices,
			showOtherItem: true,
			otherText: 'Other (please specify)',
			isRequired: false,
			visible: false
		},
		{
			type: 'checkbox',
			name: 'race_ethnicity',
			title: 'Which of the following best describes your race and/or ethnicity? ',
			description: 'Note, you may report more than one group.',
			choices: raceChoices,
			showOtherItem: true,
			otherText: 'Other (please specify)',
			isRequired: false
		},
		{
			type: 'text',
			name: 'tribal_affil',
			title: 'Do you have a Tribal Affiliation? If so, what is it?'
		},
		{
			type: 'html',
			name: 'va_health_eligible_instruction',
			html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>INTERVIEWER: Because the respondent has indicated they are under 18, only ask about <i>family members\'</i> status</strong></div>',
			visibleIf: "{is_adult} = 'No'"
		},
		{
			type: 'radiogroup',
			name: 'veteran_status',
			title: 'Are you or a member of your immediate family a veteran?',
			choices: [
				'Yes, I am a veteran',
				'Yes, a member of my immediate family is a veteran',
				'Yes, I am a veteran AND a member of my immediate family is a veteran',
				'No, neither I nor a member of my immediate family are veterans',
				'Choose not to answer',
				'Do not know'
			],
			isRequired: false
		},
		{
			type: 'radiogroup',
			name: 'va_health_eligible',
			title: 'Have you ever received health care of other benefits from a Veterans Administration (VA) center?',
			choices: ['Yes', 'No', 'Do not know'],
			isRequired: false
		}
	]
};

// SECTION 3.2
const healthPage = {
	name: 'health',
	title: 'Health',
	elements: [
		{
			type: 'radiogroup',
			name: 'fleeing_dv',
			title: 'Are you currently experiencing homelessness because you are/were fleeing domestic violence, dating violence, sexual assault, or stalking?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: false
		},
		{
			type: 'radiogroup',
			name: 'disabled',
			title: 'Do you identify as having a disability?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: false
		},
		{
			type: 'radiogroup',
			name: 'mental_health',
			title: 'Do you identify as having a severe mental illness?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: false
		},
		{
			type: 'radiogroup',
			name: 'substance_use',
			title: 'Do you identify as having a substance use disorder?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: false
		}
	]
};

// SECTION 4.0
const householdPage = {
	name: 'household',
	title: 'Household',
	elements: [
		{
			type: 'html',
			name: 'household_instruction',
			html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>Please list the initials of all the people in your household (anyone who shares the same dwelling with you)</strong></div>'
		},
		{
			type: 'paneldynamic',
			name: 'household_members',
			title: 'Household Members',
			templateElements: [
				{
					type: 'text',
					name: 'hh_member_initials',
					title: 'Initials',
					placeholder: 'e.g., JD',
					validators: [
						{
							type: 'regex',
							text: 'Please enter initials (1-4 letters)',
							regex: '^[A-Za-z]{1,4}$'
						}
					],
					isRequired: false
				},
				{
					type: 'dropdown',
					name: 'hh_member_relation',
					title: 'How is {panel.hh_member_initials} related to you?',
					choices: [
						'Parent/Legal guardian',
						'Other adult family member',
						'Sibling',
						'My own child',
						'Spouse',
						'Non-married partner',
						'Other non-family member'
					],
					isRequired: false
				},
				{
					type: 'dropdown',
					name: 'hh_member_age',
					title: 'How old is {panel.hh_member_initials}?',
					choices: [
						'Under 18 years old',
						'18 - 24 years old',
						'25 years or older'
					],
					isRequired: false
				},
				{
					type: 'radiogroup',
					name: 'hh_member_gender_id',
					title: 'Which of the following best describes the gender of {panel.hh_member_initials}?',
					choices: genderChoices,
					searchEnabled: true,
					isRequired: false
				},
				{
					type: 'checkbox',
					name: 'hh_member_race_ethnicity',
					title: 'Which of the following best describes the race and/or ethnicity of {panel.hh_member_initials}? (Note, you may report more than one group.)',
					choices: raceChoices,
					searchEnabled: true,
					isRequired: false,
					visible: true
				},
				{
					type: 'text',
					name: 'hh_member_tribal_id',
					title: 'Does {panel.hh_member_initials} have a Tribal Affiliation? If so, what is their Tribal Affiliation?'
				},
				{
					type: 'radiogroup',
					name: 'hh_member_vet_status',
					title: 'Is {panel.hh_member_initials} a veteran?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: false
				},
				{
					type: 'radiogroup',
					name: 'hh_member_disability',
					title: 'Does {panel.hh_member_initials} identify as having a disability?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: false
				},
				{
					type: 'radiogroup',
					name: 'hh_member_smi',
					title: 'Does {panel.hh_member_initials} identify as having a severe mental illness?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: false
				},
				{
					type: 'radiogroup',
					name: 'hh_member_sud',
					title: 'Does {panel.hh_member_initials} identify as having a substance use disorder?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: false
				}
			],
			panelCount: 0,
			minPanelCount: 0,
			maxPanelCount: 10,
			panelAddText: '+ Add household member',
			panelRemoveText: 'Remove',
			displayMode: 'tab',
			templateTitle: 'Household Member: {panel.hh_member_initials}',
			allowAddPanel: true,
			allowRemovePanel: true
		}
	]
};

// SECTION 5.0
const specialQuestionsPage = {
	name: 'special-questions',
	title: 'Special Questions',
	elements: [
		{
			type: 'radiogroup',
			name: 'pit24',
			title: 'Did you participate in Point-in-Time County (PIT) survey in 2024?',
			choices: [
				{
					value: 'Item 1',
					text: 'Yes'
				},
				{
					value: 'Item 2',
					text: 'No'
				},
				{
					value: 'Item 3',
					text: 'Do not know'
				},
				{
					value: 'Item 4',
					text: 'Choose not to answer'
				}
			]
		},
		{
			type: 'dropdown',
			name: 'travel_location',
			title: 'Where did you travel from today? (Town or City)',
			choices: [
				'Tukwila',
				'Burien',
				'Renton',
				'Kent',
				'Auburn',
				'SeaTac',
				'Federal Way',
				'Pacific',
				'Algona',
				'Normandy Park',
				'Des Moines',
				'Newcastle',
				'Milton',
				'Seattle'
			],
			showOtherItem: true,
			showNoneItem: true,
			noneText: 'Do not know',
			otherText: 'Other (please specify)'
		},
		{
			type: 'checkbox',
			name: 'travel_transport',
			title: 'What transportation did you use to come to {location}?',
			choices: [
				'Bus',
				'Link light Rail',
				'Ferry',
				'Car',
				'Bicycle / Bike',
				'Walking'
			],
			showOtherItem: true,
			otherText: 'Other (please specify)',
			isRequired: false
		},
		{
			type: 'panel',
			name: 'travel_time',
			title: 'How long did it take you to travel to get to {location}?',
			elements: [
				{
					type: 'slider',
					name: 'travel_time_hours',
					title: 'Hours',
					min: 0,
					max: 10,
					step: 1
				},
				{
					type: 'slider',
					name: 'travel_time_minutes',
					title: 'Minutes',
					min: 0,
					max: 60,
					step: 5
				}
			]
		},
		{
			type: 'checkbox',
			name: 'travel_distance',
			title: 'About how many miles did you travel to {location}?',
			choices: [
				'Less than half a mile',
				'Half a mile to 1 mile'
			],
			showOtherItem: true,
			otherPlaceholder: 'Enter integer value',
			otherText: 'Other (please specify in integer miles)'
		},
		{
			type: 'panel',
			name: 'last_stable_panel',
			elements: [
				{
					type: 'radiogroup',
					name: 'last_stable_loc',
					title: 'Where did you live the last time you had stable housing such as an apartment or a house?',
					choices: [
						'King County',
						'Washington State (Outside of King County)',
						'United States (Outside of Washington State)',
						'Outside of the United States',
						'Choose not to answer',
						'Do not know'
					]
				},
				{
					type: 'dropdown',
					name: 'last_stable_loc_city',
					visibleIf: "{last_stable_loc} = 'King County'",
					title: 'Which city in King County was it?',
					choices: [
						'Algona',
						'Auburn',
						'Bear Creek/Sammamish (Unincorporated)',
						'Beaux Arts',
						'Bellevue',
						'Black Diamond',
						'Bothell',
						'Burien',
						'Carnation',
						'Clyde hill',
						'Covington',
						'Des Moines',
						'Duvall',
						'East Federal Way (Unincorporated)',
						'East Renton (Unincorporated)',
						'Enumclaw',
						'Fairwood (Unincorporated)',
						'Federal Way',
						'Four Creeks/Tiger Mountain (Unincorporated)',
						'Hunts Point',
						'Issaquah',
						'Kenmore',
						'Kent',
						'Kirkland',
						'Lake Forest Park',
						'Maple Valley',
						'Medina',
						'Mercer Island',
						'Milton',
						'Newcastle',
						'Normandy Park',
						'North Bend',
						'North Highline (Unincorporated)',
						'Pacific',
						'Renton',
						'Sammamish',
						'Sea Tac',
						'Seattle',
						'Shoreline',
						'Skykomish',
						'Snoqualmie',
						'Redmond',
						'Snoqualmie Valley/Northeast',
						'King County (Unincorporated)',
						'Southeast King County (Unincorporated)',
						'Tukwila',
						'Unincorporated King County Other (includes any community not otherwise listed) -',
						'Bryn Mawr Skyway',
						'White Center',
						'South Park',
						'Fairwood',
						'East Renton Highlands',
						'Cottage Lake',
						'Fall City',
						'Hobart',
						'Union Hill',
						'Vashon/Maury Island',
						'West Hill (Unincorporated)',
						'Woodinville',
						'Yarrow Point'
					]
				},
				{
					type: 'dropdown',
					name: 'last_stable_loc_county',
					visibleIf: "{last_stable_loc} = 'Washington State (Outside of King County)'",
					title: 'Which county in Washington State was it?',
					choices: [
						'Adams',
						'Asotin',
						'Benton',
						'Chelan',
						'Clallam',
						'Clark',
						'Columbia',
						'Cowlitz',
						'Douglas',
						'Ferry',
						'Franklin',
						'Garfield',
						'Grant',
						'Grays Harbor',
						'Island',
						'Jefferson',
						'Kitsap',
						'Kittititas',
						'Klickitat',
						'Lewis',
						'Lincoln',
						'Mason',
						'Okanogan',
						'Pend Orellie',
						'Pierce',
						'San Juan (County)',
						'Skagit',
						'Skamania',
						'Snohomish',
						'Spokane',
						'Stevens',
						'Thurston',
						'Wahkiakum',
						'Walla Walla (County)',
						'Whatcom',
						'Whitman',
						'Yakima (County)'
					]
				},
				{
					type: 'dropdown',
					name: 'last_stable_loc_state',
					visibleIf: "{last_stable_loc} = 'United States (Outside of Washington State)'",
					title: 'Which  state in the United States?',
					choices: [
						'Alabama',
						'Alaska',
						'Arizona',
						'Arkansas',
						'California',
						'Colorado',
						'Connecticut',
						'Delaware',
						'Florida',
						'Georgia',
						'Hawaii',
						'Idaho',
						'Illinois',
						'Indiana',
						'Iowa',
						'Kansas',
						'Kentucky',
						'Louisiana',
						'Maine',
						'Maryland',
						'Massachusetts',
						'Michigan',
						'Minnesota',
						'Mississippi',
						'Missouri',
						'Montana',
						'Nebraska',
						'Nevada',
						'New Hampshire',
						'New Jersey',
						'New Mexico',
						'New York',
						'North Carolina',
						'North Dakota',
						'Ohio',
						'Oklahoma',
						'Oregon',
						'Pennsylvania',
						'Rhode Island',
						'South Carolina',
						'South Dakota',
						'Tennessee',
						'Texas',
						'Utah',
						'Vermont',
						'Virginia',
						'West Virginia',
						'Wisconsin',
						'Wyoming'
					]
				}
			]
		},
		{
			type: 'html',
			name: 'age_first_hmlss_instruction',
			html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>INTERVIEWER: Because the respondent has indicated they are under 18, you may select 0-17 without asking the question.</strong></div>',
			visibleIf: "{is_adult} = 'No'"
		},
		{
			type: 'dropdown',
			name: 'age_first_hmlss',
			title: 'How old were you the first time you experienced homelessness?',
			choices: [
				'0-17',
				'18-24',
				'25-35',
				'36-49',
				'50-65',
				'66 or older',
				'Choose not to answer',
				'Do not know'
			]
		},
		{
			type: 'tagbox',
			name: 'precipitating_events',
			title: 'What events or conditions contributed to you becoming homeless at this time?',
			choices: [
				'Lost job',
				'Eviction',
				'Foreclosure',
				'Incarceration/detention',
				'Illness/medical problem',
				'Substance Use Disorder',
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
				'Choose not to answer',
				'Do not know'
			],
			showOtherItem: true,
			otherText: 'Other (please specify)'
		},
		{
			type: 'text',
			name: 'year_evicted',
			visibleIf: "{precipitating_events} contains 'Eviction'",
			title: 'What year were you evicted?',
			validators: [
				{
					type: 'numeric',
					minValue: 1900,
					maxValue: 2026
				}
			],
			inputType: 'number',
			placeholder: 'YYYY'
		},
		{
			type: 'radiogroup',
			name: 'eviction_type',
			visibleIf: "{precipitating_events} contains 'Eviction'",
			title: 'Was the law enforcement involved?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know']
		},
		{
			type: 'radiogroup',
			name: 'eviction_court_ordered',
			visibleIf: "{eviction_type} = 'Yes'",
			title: 'Were you ordered to court?',
			choices: ['Yes', 'No']
		},
		{
			type: 'tagbox',
			name: 'shelter_priorities',
			title: 'If you were to seek out a shelter program, what top shelter features would be most important to you? (Please select up to 5)',
			choices: [
				'Ease of access/enrollment',
				'Close to where I stay now/ In my current community',
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
				'On-site health services such as a nurse'
			],
			showOtherItem: true,
			otherText: 'Other (please specify)',
			maxSelectedChoices: 5
		},
		{
			type: 'dropdown',
			name: 'pet_animal',
			title: 'Do you have a pet or animal companion?',
			choices: ['Yes', 'No', 'Choose not to answer'],
			isRequired: false
		},
		{
			type: 'paneldynamic',
			name: 'pet_animal_details',
			title: 'Pet Information',
			templateElements: [
				{
					type: 'text',
					name: 'pet_name',
					title: 'Pet Name (optional)',
					placeholder: 'e.g., Fluffy'
				},
				{
					type: 'radiogroup',
					name: 'pet_animal_type',
					title: 'Type of Animal',
					choices: [
						'Cat',
						'Dog',
						'Pocket pet / rodent',
						'Choose not to answer'
					],
					showOtherItem: true,
					otherText: 'Specify other animal type'
				},
				{
					type: 'radiogroup',
					name: 'pet_animal_weight',
					title: 'Approximate Weight of {panel.pet_name}',
					choices: [
						'40 lbs or less',
						'More than 40 lbs',
						{
							value: 'More than 41 lbs',
							text: 'Choose not to answer'
						}
					]
				},
				{
					type: 'radiogroup',
					name: 'pet_animal_vet_care',
					title: 'Has {panel.pet_name} seen vet care in last 3 years (such as for wellness visits, vaccines, or an illness)?',
					choices: [
						'Yes',
						'No',
						{
							value: 'Item 1',
							text: 'Choose not to answer'
						}
					]
				},
				{
					type: 'radiogroup',
					name: 'pet_medical_needs',
					title: 'How long have you been responsible for {panel.pet_name}?',
					choices: [
						'Less than 1 year',
						'1-3 years',
						'More than 3 years',
						{
							value: 'More than 4 years',
							text: 'Choose not to answer'
						}
					]
				}
			],
			displayMode: 'tab',
			maxPanelCount: 10,
			panelAddText: '+ Add new pet',
			panelRemoveText: 'Remove',
			templateTitle: 'Pet: {panel.pet_name}',
			visibleIf: "{pet_animal} = 'Yes'"
		}
	]
};

// SECTION 6.0
const surveyDeduplicationPage = {
	name: 'survey_deduplication',
	title: 'Survey Deduplication',
	elements: [
		{
			type: 'checkbox',
			name: 'deduplication',
			title: "After completing this survey, do you believe you have completed this before?",
			choices: ['Yes', 'No', 'Do not know'],
			isRequired: false
		}
	]
};

const outroPage = {
	name: 'outro',
	title: 'Outro',
	elements: [
		{
			type: 'html',
			name: 'outro_html',
			html: "<strong>That completes the questions for today's survey. Thank you so much for your responses and your time. We will now issue the gift card and prepare your coupons to pass out to others in your network who are unsheltered.</strong>"
		}
	]
};
