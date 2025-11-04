export const generateSurveyJson = (locations: any[]) => {
	const preScreenPage = generateVolunteerPreScreenPage(locations);

	return {
		title: 'Homelessness Experience Survey',
		showProgressBar: 'top',
		progressBarType: 'buttons',
		pages: [
			preScreenPage,
			consentPage,
			surveyValidationPage,
			personalLivingSituationPage,
			networkPage,
			livingSituationPage,
			demographicsPage,
			healthPage,
			householdPage,
			specialQuestionsPage,
			youthSpecialQuestionsPage,
			surveyDepulicationPage,
			outroPage
		]
	};
};

// PRE-SCREENING
const generateVolunteerPreScreenPage = (locationChoices: any[]) => {
	return {
		name: 'volunteer-pre-screen',
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
				choices: locationChoices,
				isRequired: true
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
			html: `<div><strong>Please read the following consent information out loud to the respondent and have them orally give their consent to you:</strong></div>
            <br />
<p>As part of work with the King County Regional Homelessness Authority (KCRHA), I’d like to ask you some questions we’re required to ask and collect for our funders about unsheltered homelessness in our region.</p>
<p>Your participation is voluntary and will not affect any services you or your family are seeking or currently receiving. We are surveying many people and will put all responses together, so it will not be possible to identify you from the information you provide here.</p>
<p>As a token of appreciation for your time, we will give you a $20 preloaded debit card, $40 for families with minor children at the end.</p>
<p>Would you be willing to talk with me for about 30 min?</p>`
		},
		{
			type: 'radiogroup',
			name: 'consent_given',
			title: 'Did the subject orally consent to participate?',
			choices: ['Yes', 'No'],
			isRequired: true
		}
	]
};

// SECTION 1.0
const surveyValidationPage = {
	name: 'survey-validation',
	title: 'Survey Validation',
	elements: [
		{
			type: 'html',
			name: 'consent-instructions',
			html: '<div><strong>Please ask the respondent if they are above the age of 18. The survey will end if they are not at least 18 years old.</strong></div>'
		},
		{
			type: 'radiogroup',
			name: 'is_adult',
			title: 'Is the respondent at least 18 years old?',
			choices: ['Yes', 'No'],
			isRequired: true
		},
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
			inputType: 'date'
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
			hasOther: true,
			otherText: 'Other (please specify)',
			colCount: 2,
			maxSelectedChoices: 1,
			isRequired: true
		},
		{
			type: 'dropdown',
			name: 'vehicle_amenities',
			title: 'Does your vehicle have access to any of the following needs?',
			choices: [
				'Drinking water',
				'Restroom/Toilet',
				'Heat and/or Cooling',
				'Ability to bathe',
				'Ability to cook hot food'
			],
			hasSelectAll: true,
			separateSpecialChoices: true,
			isRequired: true,
			visibleIf:
				"{sleeping_situation} = 'small_vehicle' or {sleeping_situation} = 'large_vehicle'"
		},
		{
			type: 'dropdown',
			name: 'personal_amenities',
			title: 'Do you generally have access to any of the following needs?',
			choices: [
				'Drinking water',
				'Restroom/Toilet',
				'Heat and/or Cooling',
				'Ability to bathe',
				'Ability to cook hot food'
			],
			hasSelectAll: true,
			isRequired: true,
			visibleIf: '{sleeping_situation} notempty'
		}
	]
};

// SECTION 3.0
const networkPage = {
	name: 'network_questions',
	title: 'Network Module',
	elements: [
		{
			type: 'text',
			name: 'non_family_network_size',
			title: 'Other than any family living with you, how many people do you closely know who are also unhoused or experiencing homelessness today?',
			inputType: 'number',
			validators: [{ type: 'numeric', minValue: 0 }]
		},
		{
			type: 'html',
			name: 'network_instruction',
			html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>Instructions:</strong> Please fill in information for each person below. You can add or remove rows as needed.</div>'
		},
		{
			type: 'paneldynamic',
			name: 'non_family_network',
			title: 'Network Connections',
			templateElements: [
				{
					type: 'text',
					name: 'name_pseudo',
					title: 'Name/Nickname',
					placeholder: 'Name or nickname'
				},
				{
					type: 'dropdown',
					name: 'relationship',
					title: 'Relationship',
					choices: [
						'Friend',
						'Acquaintance',
						'Partner (husband/wife, fiancé/fiancée, boyfriend/girlfriend, etc.)',
						'Immediate family (parent/father/mother, sibling/brother/sister, child/song/daughter',
						'Extended family (cousin, nephew/niece, uncle/aunt, grandparent/grandfather/grandmother)',
						'Neighbor (people you live near'
					],
					hasOther: true,
					otherText: 'Other (please specify)',
					searchEnabled: true,
					placeholder: 'Select relationship...'
				},
				{
					type: 'dropdown',
					name: 'sleeping_situation',
					title: 'Where do they currently sleep?',
					choices: [
						...sleepingSituationChoices,
						{ value: 'deceased', text: 'Deceased' }
					],
					colCount: 2,
					hasOther: true,
					otherText: 'Other (please specify)'
				}
			],
			panelCount: 0,
			minPanelCount: 0,
			maxPanelCount: 50,
			panelAddText: '+ Add another person',
			panelRemoveText: 'Remove',
			renderMode: 'list',
			templateTitle: 'Person #{panelIndex}',
			allowAddPanel: true,
			allowRemovePanel: true
		}
	],
	visibleIf: "{consent_given} = 'Yes'"
};

const livingSituationPage = {
	name: 'living_situation',
	title: 'Living Situation',
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
			isRequired: true
		},
		{
			type: 'radiogroup',
			name: 'num_episodes',
			title: 'Including this time, how many different times have you been homelss in the past 3 years, that is since January 2026?',
			choices: [
				'1 time',
				'2 times',
				'3 times',
				'4 or more times',
				'Choose not to answer',
				'Do not know'
			],
			isRequired: true
		},
		{
			type: 'panel',
			name: 'overall_lot_homeless',
			title: 'If you added up all the time you have spent experiencing homelessness in the past 3 years, about how long would that be?',
			elements: [
				{
					type: 'text',
					name: 'overall_lot_homeless_number',
					title: 'Number of days/months/years',
					inputType: 'number',
					validators: [{ type: 'integer', minValue: 1 }],
					startWithNewLine: false,
					width: '100px'
				},
				{
					type: 'dropdown',
					name: 'overall_lot_homeless_unit',
					title: 'Unit (days/months/years)',
					choices: [
						{ value: 'days', text: 'Days' },
						{ value: 'months', text: 'Months' },
						{ value: 'years', text: 'Years' }
					],
					startWithNewLine: false,
					width: '150px'
				}
			],
			isRequired: true
		},
		{
			type: 'radiogroup',
			name: 'shelter_svcs',
			title: 'In the past 3 years, have you enrolled in an Emergency Shelter or received any other form of housing assistance from an organization that serves people experiencing homelessness? (Includes referrals, vouchers, hygiene support, etc.)',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: true
		},
		{
			type: 'html',
			name: 'shelter_svcs_instruction',
			html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>INTERVIEWER: If \'Yes\', fill out the table below as much as possible</strong></div>',
			visibleIf: "{shelter_svcs} = 'Yes'"
		},
		{
			type: 'paneldynamic',
			name: 'shelter_svcs_table',
			title: 'Housing Assistance Services',
			templateElements: [
				{
					type: 'text',
					name: 'shelter_svcs_date',
					title: 'Date of Last Service Received',
					inputType: 'month',
					validators: [
						{
							type: 'regex',
							text: 'Please enter date in MM/YYYY format (e.g., 03/2024)',
							regex: '^(0[1-9]|1[0-2])\\/20[2-9][0-9]$'
						}
					]
				},
				{
					type: 'radiogroup',
					name: 'shelter_svcs_type',
					title: 'Type of Service Received',
					choices: [
						'Street Outreach',
						'Diversion',
						'Emergency Shelter',
						'Temporary Housing',
						'Coordinated Entry',
						'Severe Weather Shelter [Seasonal]',
						'Day Center',
						'Food bank',
						'Case Management'
					],
					colCount: 2,
					hasOther: true,
					otherText: 'Other (please specify)'
				}
			],
			panelCount: 0,
			minPanelCount: 0,
			maxPanelCount: 50,
			panelAddText: '+ Add another service',
			panelRemoveText: 'Remove',
			renderMode: 'list',
			templateTitle: 'Service #{panelIndex}',
			allowAddPanel: true,
			allowRemovePanel: true,
			visibleIf: "{shelter_svcs} = 'Yes'"
		}
	],
	visibleIf: "{consent_given} = 'Yes'"
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

const raceChoices = [
	'American Indian',
	'Alaskan Native or Indigenous',
	'Asian or Asian American',
	'Black, African American, or African',
	'Hispanic/Latina/e/o',
	'Middle Eastern or North African',
	'Native Hawaiian or Pacific Islander',
	'White',
	'Other (please specify)',
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
			type: 'dropdown',
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
			isRequired: true
		},
		{
			type: 'tagbox',
			name: 'gender_id',
			title: 'Which of the following best describes your gender? (Select all that apply)',
			choices: genderChoices,
			isRequired: true,
			hasOther: true,
			otherText: 'Other (please specify)',
			searchEnabled: true
		},
		{
			type: 'radiogroup',
			name: 'ethnicity',
			title: 'Are you Hispanic/ Latina/e/o?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: true
		},
		{
			type: 'tagbox',
			name: 'race_id',
			title: 'Which of the following best describes your racial identity? (Select all that apply)',
			choices: raceChoices,
			hasOther: true,
			otherText: 'Other (please specify)',
			isRequired: true,
			searchEnabled: true
		},
		{
			type: 'tagbox',
			name: 'tribal_affil',
			title: 'Do you have a Tribal Affiliation? If so, what is it?',
			choices: [], // TODO
			hasOther: true,
			otherText: 'Other (please specify)',
			searchEnabled: true
		},
		{
			type: 'html',
			name: 'va_health_eligible_instruction',
			html: '<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>INTERVIEWER: Because the respondent has indicated they are under 18, only ask about <i>family members\'</i> status</strong></div>',
			visibleIf: "{is_adult} = 'No'"
		},
		{
			type: 'dropdown',
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
			isRequired: true
		},
		{
			type: 'radiogroup',
			name: 'va_health_eligible',
			title: 'Have you ever recieved health care of other benefits from a Veterans Administration (VA) center?',
			choices: ['Yes', 'No', 'Do not know'],
			isRequired: true
		}
	],
	visibleIf: "{consent_given} = 'Yes'"
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
			isRequired: true
		},
		{
			type: 'dropdown',
			name: 'disabled',
			title: 'Do you identify as having a disability?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: true
		},
		{
			type: 'dropdown',
			name: 'mental_health',
			title: 'Do you identify as having a severe mental illness?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: true
		},
		{
			type: 'dropdown',
			name: 'substance_use',
			title: 'Do you identify as having a substance use disorder?',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: true
		}
	],
	visibleIf: "{consent_given} = 'Yes'"
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
					name: 'initials',
					title: 'Initials',
					placeholder: 'e.g., JD',
					validators: [
						{
							type: 'regex',
							text: 'Please enter initials (1-4 letters)',
							regex: '^[A-Za-z]{1,4}$'
						}
					],
					isRequired: true
				},
				{
					type: 'dropdown',
					name: 'relationship',
					title: 'How is {panel.initials} related to you?',
					choices: [
						'Parent/Legal guardian',
						'Other adult family member',
						'Sibling',
						'My own child',
						'Spouse',
						'Non-married partner',
						'Other non-family member'
					],
					isRequired: true
				},
				{
					type: 'dropdown',
					name: 'age_group',
					title: 'How old is {panel.initials}?',
					choices: [
						'Under 18 years old',
						'18 - 24 years old',
						'25 years or older'
					],
					isRequired: true
				},
				{
					type: 'tagbox',
					name: 'gender',
					title: 'Which of the following best describes the gender of {panel.initials}?',
					choices: genderChoices,
					searchEnabled: true,
					isRequired: true
				},
				{
					type: 'dropdown',
					name: 'ethnicity',
					title: 'Is {panel.initials} Hispanic/Latina/e/o?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: true
				},
				{
					type: 'tagbox',
					name: 'race',
					title: 'Which of the following best describes the racial identity of {panel.initials}?',
					choices: raceChoices,
					searchEnabled: true,
					isRequired: true
				},
				{
					type: 'tagbox',
					name: 'hh_member_tribal_id',
					title: 'Does {panel.initials} have a Tribal Affiliation? If so, what is their Tribal Affiliation?',
					choices: [], // TODO
					hasOther: true,
					otherText: 'Other (please specify)',
					searchEnabled: true,
					isRequired: true
				},
				{
					type: 'dropdown',
					name: 'hh_member_veteran_status',
					title: 'Is {panel.initials} a veteran?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: true
				},
				{
					type: 'dropdown',
					name: 'hh_member_disability',
					title: 'Does {panel.initials} identify as having a disability?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: true
				},
				{
					type: 'dropdown',
					name: 'hh_member_mental_health',
					title: 'Does {panel.initials} identify as having a severe mental illness?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: true
				},
				{
					type: 'dropdown',
					name: 'hh_member_substance_use',
					title: 'Does {panel.initials} identify as having a substance use disorder?',
					choices: [
						'Yes',
						'No',
						'Choose not to answer',
						'Do not know'
					],
					isRequired: true
				}
			],
			panelCount: 0,
			minPanelCount: 0,
			maxPanelCount: 10,
			panelAddText: '+ Add household member',
			panelRemoveText: 'Remove',
			renderMode: 'list',
			templateTitle: 'Household Member: {panel.initials}',
			allowAddPanel: true,
			allowRemovePanel: true
		}
	],
	visibleIf: "{consent_given} = 'Yes'"
};

// SECTION 5.0
const specialQuestionsPage = {
	name: 'special-questions',
	title: 'Special Questions',
	elements: [
		{
			type: 'html',
			name: 'place_of_origin_reference',
			html: `
                <div style="background-color: #f8f9fa; padding: 15px; margin: 10px 0; border: 1px solid #dee2e6; border-radius: 4px;">
                    <h4 style="margin-top: 0;">Location Reference Guide</h4>
                    
                    <ul style="line-height: 1.8;">
                        <li><strong>Snoqualmie Valley</strong><br/>
                            Snoqualmie; North Bend; Carnation; Duvall; Preston; Riverpoint; Skykomish</li>
                        
                        <li><strong>North King County</strong><br/>
                            Shoreline; Lake Forest Park; Bothell; Kenmore; Lake City; Woodinville</li>
                        
                        <li><strong>East King County</strong><br/>
                            Kirkland; Redmond; Bellevue; Mercer Island; Sammamish; Beaux Arts Village; Issaquah; Clyde Hill; Yarrow Point; Medina</li>
                        
                        <li><strong>South King County</strong><br/>
                            Tukwila; Burien; Renton; Kent; Auburn; SeaTac; Federal Way; Pacific; Algona; Normandy Park; Des Moines; Newcastle; Milton</li>
                        
                        <li><strong>South East King County</strong><br/>
                            Maple Valley; Black Diamond; Enumclaw; Covington</li>
                        
                        <li><strong>Unincorporated King County</strong><br/>
                            Bryn Mawr Skyway; White Center; South Park; Fairwood; East Renton Highlands; Cottage Lake; Fall City; Hobart; Union Hill</li>
                        
                        <li><strong>Seattle Metro/ Vashon-Murray Island</strong><br/>
                            Seattle Neighborhood A; Seattle Neighborhood B; Seattle Neighborhood C; Seattle Neighborhood D; Seattle Neighborhood E; Seattle Neighborhood F; Seattle Neighborhood G; Vashon-Murray Island<br/>
                            <em>(select neighborhood on map below and enter as Seattle ___)</em></li>
                    </ul>
                    
                    <div style="margin-top: 15px; text-align: center;">
                        <img src="[MAP_IMAGE_URL_PLACEHOLDER]" alt="Seattle Neighborhood Map" style="max-width: 100%; height: auto; border: 1px solid #ccc;"/>
                    </div>
                </div>
            `
		},
		{
			type: 'dropdown',
			name: 'place_of_origin',
			title: 'Where did you travel from today? (Town or City)',
			choices: [
				'Snoqualmie',
				'North Bend',
				'Carnation',
				'Duvall',
				'Preston',
				'Tukwila',
				'Burien',
				'Renton',
				'Kent',
				'Auburn',
				'Seatac',
				'Federal Way',
				'Pacific',
				'Algona',
				'Normandy Park',
				'Des Moines',
				'Newcastle',
				'Fairwood (unincorporated)',
				'East federal Way (unincorporated)',
				'Maple Valley',
				'Black Diamond',
				'Enumclaw',
				'Covington',
				'Skyway',
				'White Center',
				'Seattle A',
				'Seattle B',
				'Seattle C',
				'Seattle D',
				'Seattle E',
				'Seattle F',
				'Seattle G',
				'Choose not to answer',
				'Do not know'
			],
			hasOther: true,
			otherText: 'Other (please specify)',
			searchEnabled: true,
			isRequired: true
		},
		{
			type: 'dropdown',
			name: 'mode_of_transpo',
			title: 'What transportation did you use to come to {location}?',
			choices: [
				'Bus',
				'Link light Rail',
				'Ferry',
				'Car',
				'Bicycle / Bike',
				'Walking'
			],
			hasOther: true,
			otherText: 'Other (please specify)',
			searchEnabled: true,
			isRequired: true
		},
		{
			type: 'panel',
			name: 'travel_time',
			title: 'How long did it take you to travel to get to {location}?',
			elements: [
				{
					type: 'text',
					name: 'travel_time_hours',
					title: 'Hours',
					inputType: 'number',
					placeholder: '0',
					validators: [
						{ type: 'numeric', minValue: 0, maxValue: 23 }
					],
					startWithNewLine: false,
					width: '100px'
				},
				{
					type: 'text',
					name: 'travel_time_minutes',
					title: 'Minutes',
					inputType: 'number',
					placeholder: '0',
					validators: [
						{ type: 'numeric', minValue: 0, maxValue: 59 }
					],
					startWithNewLine: false,
					width: '100px'
				}
			]
		},
		{
			type: 'dropdown',
			name: 'travel_dist',
			title: 'About how many miles did you travel to {location}?',
			choices: ['Less than half a mile', 'Half a mile to 1 mile'],
			hasOther: true,
			otherText: 'Other (please specify in integer miles)',
			otherPlaceHolder: 'Enter integer value',
			otherValidator: {
				type: 'regex',
				regex: '^[0-9]+$',
				text: 'Please enter an integer value in miles'
			},
			searchEnabled: true,
			isRequired: true
		},
		{
			type: 'html',
			name: 'last_stable_loc_instruction',
			html: `<div style="background-color: #fff3cd; padding: 10px; margin: 10px 0;"><strong>Have the respondent review the list below and select the appropriate response for last stable location.</strong></div>
            <ul style="line-height: 1.8;">
             <li>Algona</li>
             <li>Auburn</li>
             <li>Bear Creek/Sammamish (Unincorporated)</li>
             <li>Beaux Arts</li>
             <li>Bellevue</li>
             <li>Black Diamond</li>
             <li>Bothell</li>
             <li>Burien</li>
             <li>Carnation</li>
             <li>Choose not to answer</li>
             <li>Clyde hill</li>
             <li>Covington</li>
             <li>Data not collected</li>
             <li>Des Moines</li>
             <li>Do not know</li>
             <li>Duvall</li>
             <li>East Federal Way (Unincorporated)</li>
             <li>East Renton (Unincorporated)</li>
             <li>Enumclaw</li>
             <li>Fairwood (Unincorporated)</li>
             <li>Federal Way</li>
             <li>Four Creeks/Tiger Mountain (Unincorporated)</li>
             <li>Hunts Point</li>
             <li>Issaquah</li>
             <li>Kenmore</li>
             <li>Kent</li>
             <li>Kirkland</li>
             <li>Lake Forest Park</li>
             <li>Maple Valley</li>
             <li>Medina</li>
             <li>Mercer Island</li>
             <li>Milton</li>
             <li>Newcastle</li>
             <li>Normandy Park</li>
             <li>North Bend</li>
             <li>North Highline (Unincorporated)</li>
             <li>Pacific</li>
             <li>Renton</li>
             <li>Sammamish</li>
             <li>Sea Tac</li>
             <li>Seattle</li>
             <li>Shoreline</li>
             <li>Skykomish</li>
             <li>Snoqualmie</li>
             <li>Redmond</li>
             <li>Snoqualmie Valley/Northeast</li>
             <li>King County (Unincorporated)</li>
             <li>Southeast King County (Unincorporated)</li>
             <li>Tukwila</li>
             <li>Unincorporated King County Other (includes any community not otherwise listed) - </li>
             <li>Bryn Mawr Skyway</li>
             <li>White Center</li>
             <li>South Park</li>
             <li>Fairwood</li>
             <li>East Renton Highlands</li>
             <li>Cottage Lake</li>
             <li>Fall City</li>
             <li>Hobart</li>
             <li>Union Hill</li>
             <li>Alabama</li>
             <li>Alaska</li>
             <li>Arizona</li>
             <li>Arkansas</li>
             <li>California</li>
             <li>Colorado</li>
             <li>Connecticut</li>
             <li>Delaware</li>
             <li>Florida</li>
             <li>Georgia</li>
             <li>Hawaii</li>
             <li>Idaho</li>
             <li>Illinois</li>
             <li>Indiana</li>
             <li>Iowa</li>
             <li>Kansas</li>
             <li>Kentucky</li>
             <li>Louisiana</li>
             <li>Maine</li>
             <li>Maryland</li>
             <li>Massachusetts</li>
             <li>Michigan</li>
             <li>Minnesota</li>
             <li>Mississippi</li>
             <li>Missouri</li>
             <li>Montana</li>
             <li>Nebraska</li>
             <li>Nevada</li>
             <li>New Hampshire</li>
             <li>New Jersey</li>
             <li>New Mexico</li>
             <li>New York</li>
             <li>North Carolina</li>
             <li>North Dakota</li>
             <li>Ohio</li>
             <li>Oklahoma</li>
             <li>Oregon</li>
             <li>Pennsylvania</li>
             <li>Rhode Island</li>
             <li>South Carolina</li>
             <li>South Dakota</li>
             <li>Tennessee</li>
             <li>Texas</li>
             <li>Utah</li>
             <li>Vermont</li>
             <li>Virginia</li>
             <li>West Virginia</li>
             <li>Wisconsin</li>
             <li>Wyoming</li>
             <li>Vashon/Maury Island</li>
             <li>West Hill (Unincorporated)</li>
             <li>Woodinville</li>
             <li>Yarrow Point</li>
             <li>Washington State (outside of King County) -</li>
             <li>Adams</li>
             <li>Asotin</li>
             <li>Benton</li>
             <li>Chelan</li>
             <li>Clallam</li>
             <li>Clark</li>
             <li>Columbia</li>
             <li>Cowlitz</li>
             <li>Douglas</li>
             <li>Ferry</li>
             <li>Franklin</li>
             <li>Garfield</li>
             <li>Grant</li>
             <li>Grays Harbor</li>
             <li>Island</li>
             <li>Jefferson</li>
             <li>Kitsap</li>
             <li>Kittititas</li>
             <li>Klickitat</li>
             <li>Lewis</li>
             <li>Lincoln</li>
             <li>Mason</li>
             <li>Okanogan</li>
             <li>Pacific</li>
             <li>Pend Orellie</li>
             <li>Pierce</li>
             <li>San Juan (County)</li>
             <li>Skagit</li>
             <li>Skamania</li>
             <li>Snohomish</li>
             <li>Spokane</li>
             <li>Stevens</li>
             <li>Thurston</li>
             <li>Wahkiakum</li>
             <li>Walla Walla (County)</li>
             <li>Whatcom</li>
             <li>Whitman</li>
             <li>Yakima (County)</li>
             <li>Outside the United States</li>
             </ul>
            `
		},
		{
			type: 'dropdown',
			name: 'last_stable_loc',
			title: 'Where did you live the last time you had stable housing such as an apartment or a house?',
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
				'Choose not to answer',
				'Clyde hill',
				'Covington',
				'Data not collected',
				'Des Moines',
				'Do not know',
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
				'Wyoming',
				'Vashon/Maury Island',
				'West Hill (Unincorporated)',
				'Woodinville',
				'Yarrow Point',
				'Washington State (outside of King County) -',
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
				'Pacific',
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
				'Yakima (County)',
				'Outside the United States'
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
			type: 'checklist',
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
			choicesOrder: 'random',
			hasOther: true,
			otherText: 'Other (please specify)',
			searchEnabled: true,
			isRequired: true
		},
		{
			type: 'dropdown',
			name: 'eviction_type',
			title: 'Was it a hard (law enforcement) or soft (removal of belongings) eviction?',
			choices: ['Hard', 'Soft', 'Choose not to answer', 'Do not know'],
			visibleIf: "{precipitating_events} contains 'Eviction'"
		},
		{
			type: 'dropdown',
			name: 'TODO_eviction_lead_to_homelessness',
			title: 'Did it lead to your most recent experience of homelessness?',
			choices: ['Yes', 'No'],
			visibleIf: "{eviction_type} = 'Hard'" // TODO verify
		},
		{
			type: 'dropdown',
			name: 'TODO_eviction_court_ordered',
			title: 'Were you court ordered?',
			choices: ['Yes', 'No'],
			visibleIf: "{eviction_type} = 'Hard'" // TODO verify
		},
		{
			type: 'dropdown',
			name: 'TODO_eviction_law_enforcement_involved',
			title: 'Was the law enforcement involved?',
			choices: ['Yes', 'No'],
			visibleIf: "{eviction_type} = 'Hard'" // TODO verify
		},
		{
			type: 'text',
			name: 'year_evicted',
			title: 'What year were you evicted?',
			inputType: 'number',
			placeholder: 'YYYY',
			validators: [
				{
					type: 'numeric',
					minValue: 1900,
					maxValue: 2026
				}
			],
			visibleIf: "{eviction_type} = 'Soft'"
		},
		{
			type: 'checklist',
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
			choicesOrder: 'random',
			hasOther: true,
			otherText: 'Other (please specify)',
			searchEnabled: true,
			isRequired: true,
			maxSelectedChoices: 5
		},
		{
			type: 'dropdown',
			name: 'pet_animal',
			title: 'Do you have a pet or animal companion?',
			choices: ['Yes', 'No', 'Choose not to answer'],
			isRequired: true
		},
		{
			type: 'paneldynamic',
			name: 'pet_animal_details',
			title: 'Pet Information',
			templateElements: [
				{
					type: 'dropdown',
					name: 'pet_animal_type',
					title: 'Type of Animal',
					choices: ['Cat', 'Dog', 'Pocket pet / rodent', 'Other'],
					hasOther: true,
					otherText: 'Specify other animal type',
					isRequired: true
				},
				{
					type: 'radiogroup',
					name: 'pet_animal_weight',
					title: 'Approximate Weight',
					choices: ['40 lbs or less', 'More than 40 lbs'],
					isRequired: true
				},
				{
					type: 'radiogroup',
					name: 'pet_animal_vet_care',
					title: 'Seen vet care in last 3 years (such as for wellness visits, vaccines, or an illness)?',
					choices: ['Yes', 'No'],
					isRequired: true
				},
				{
					type: 'radiogroup',
					name: 'pet_medical_needs',
					title: 'How long have you been responsible for this animal?',
					choices: [
						'Less than 1 year',
						'1-3 years',
						'More than 3 years'
					],
					isRequired: true
				}
			],
			panelCount: 0,
			minPanelCount: 0,
			maxPanelCount: 10,
			panelAddText: '+ Add another pet',
			panelRemoveText: 'Remove',
			renderMode: 'list',
			templateTitle: 'Pet #{panelIndex}',
			allowAddPanel: true,
			allowRemovePanel: true,
			visibleIf: "{pet_animal} = 'Yes'"
		}
	]
};

// SECTION 5.1
const youthSpecialQuestionsPage = {
	name: 'youth_special_questions',
	title: 'Youth Special Questions',
	elements: [
		{
			type: 'dropdown',
			name: 'youth_school_work',
			title: 'Do you go to school or work?',
			choices: [
				'School',
				'Work',
				'Both School AND Work',
				'No',
				'Choose not to answer',
				'Do not know'
			],
			isRequired: true
		},
		{
			type: 'dropdown',
			name: 'youth_q2',
			title: 'Place holder for Youth specific question 2',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: true
		},
		{
			type: 'dropdown',
			name: 'youth_q3',
			title: 'Place holder for Youth specific question 3',
			choices: ['Yes', 'No', 'Choose not to answer', 'Do not know'],
			isRequired: true
		}
	],
	visibleIf: "{is_adult} = 'No' AND {consent_given} = 'Yes'"
};

// SECTION 6.0
const surveyDepulicationPage = {
	name: 'survey_depulication',
	title: 'Survey Depulication',
	elements: [
		{
			type: 'dropdown',
			name: 'survey_depulication',
			title: 'After completing this survey, do you believe you’ve completed this before?',
			choices: ['Yes', 'No'],
			isRequired: true
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
