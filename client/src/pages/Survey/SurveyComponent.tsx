import { useEffect, useRef, useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';

import 'survey-core/defaultV2.min.css';

import { useAbility, useApi } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
// Global Zustand store managing state of survey components
import { useAuthStore, useSurveyStore } from '@/stores';
import { useGeolocated } from 'react-geolocated';

import { generateSurveyJson } from './SurveyJson';

// This component is responsible for rendering the survey and handling its logic
// It uses the SurveyJS library to create and manage the survey
// It also handles referral code validation and geolocation
// It uses React Router for navigation and URL parameter handling
// It uses Zustand (with persist) & localstorage to manage and persist data across sessions
// It uses the useEffect hook to manage side effects, such as fetching data and updating state
// It uses the useState hook to manage component state
// It uses the useGeolocated hook to get the user's geolocation
const SurveyComponent = () => {
	const { surveyService } = useApi();
	const [searchParams] = useSearchParams();
	const codeInUrl = searchParams.get('ref');

	const [loading, setLoading] = useState(true);

	const navigate = useNavigate();
	const surveyRef = useRef<Model | null>(null);
	const { locationService } = useApi();

	const ability = useAbility();

	const { userObjectId, lastestLocationObjectId } = useAuthStore();

	// Pulls state values and update functions from Zustand store
	const {
		getObjectId,
		setObjectId,
		getReferredByCode,
		setReferredByCode,
		setSurveyData
	} = useSurveyStore();

	const { coords } = useGeolocated({
		positionOptions: {
			enableHighAccuracy: false
		},
		userDecisionTimeout: 5000
	});

	// If referral code is in URL, set it in Zustand store -- this is used for
	// initial survey load. If no referral code, this is a root survey and an empty survey is created.
	useEffect(() => {
		const init = async () => {
			setLoading(true);

			const locations = await locationService.fetchLocations();
			const locationChoices = locations.data.map((location: any) => ({
				value: location._id,
				text: location.hubName
			}));

			// Initialize survey with empty data
			surveyRef.current = new Model(generateSurveyJson(locationChoices));
			surveyRef.current.data = {};
			setSurveyData(surveyRef.current.data);

			// Use referral code if provided
			if (codeInUrl && codeInUrl !== getReferredByCode()) {
				// Check for any pre-existing survey data linked to the referral code
				const surveyData =
					await surveyService.fetchSurveyByReferralCode(codeInUrl);
				
				if (surveyData.data.length == 1) {
					// in progress survey found, populate survey with existing data
					surveyRef.current.data = surveyData.data[0].responses;
					setSurveyData(surveyData);
					setObjectId(surveyData._id);
					setReferredByCode(codeInUrl);
				} else {
					// If no in-progress survey found, check if there is a parent survey
					// If there is no parent survey, this is an invalid survey code
					const parentSurvey =
						await surveyService.fetchParentOfSurveyCode(codeInUrl);
					
					if (parentSurvey.data.length == 0) {
						alert('Invalid survey code. Please try again.');
						navigate('/apply-referral');
						return;
					}
				}
			} else if (!codeInUrl) {
				// If no referral code, check if user has permission to create a survey without a referral code
				if (
					!ability.can(
						ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL,
						SUBJECTS.SURVEY
					)
				) {
					alert(
						'You do not have permission to create a survey without a referral code.'
					);
					navigate('/apply-referral');
					return;
				}
			}

			// Attach survey events to the survey
			attachSurveyEventHandlers(surveyRef.current);
			setLoading(false);
		};
		init();
	}, []);

	const attachSurveyEventHandlers = (survey: Model | null) => {
		if (!survey) return;

		// Clear any existing handlers to prevent duplicates
		survey.onCurrentPageChanged.clear();
		survey.onComplete.clear();

		const pushHistoryState = (pageNo: number) => {
			const currentState = window.history.state;
			if (!currentState || currentState.pageNo !== pageNo) {
				window.history.pushState(
					{ pageNo },
					'',
					window.location.pathname + window.location.search
				);
			}
		};

		const getSurveyData = (data: any) => {
			return {
				responses: data ?? {},
				referredByCode: getReferredByCode() ?? null,
				coords: coords ?? { latitude: 0, longitude: 0 },
				objectId: getObjectId() ?? null
			};
		};

		survey.onCurrentPageChanged.add(async sender => {
			pushHistoryState(sender.currentPageNo);

			const surveyData = {
				...getSurveyData(sender.data),
				completed: false
			};
			setSurveyData(surveyData);

			try {
				let result = null;
				if (getObjectId() === null) {
					const req: any = {
						createdByUserObjectId: userObjectId,
						locationObjectId: lastestLocationObjectId,
						responses: surveyData.responses
					};
					// Add survey code to request if it exists
					if (getReferredByCode()) {
						req.surveyCode = getReferredByCode();
					}
					result = await surveyService.createSurvey(req);
				} else {
					result = await surveyService.updateSurvey(getObjectId()!, {
						responses: surveyData.responses
					});
				}
				if (result) {
					setObjectId(result.data._id);
				}
			} catch (error) {
				console.error('Autosave failed:', error);
			}
		});

		survey.onComplete.add(async sender => {
			const surveyData = {
				...getSurveyData(sender.data),
				completed: true
			};
			setSurveyData(surveyData);

			try {
				const result = await surveyService.updateSurvey(
					getObjectId()!,
					{
						responses: surveyData.responses,
						isCompleted: true
					}
				);
				if (result) {
					setObjectId(result.data._id);
				}
			} catch (error) {
				console.error('Error saving survey:', error);
			}
		});
	};

	// Handle browser back/forward for survey pages
	useEffect(() => {
		const handlePopState = (event: { state: { pageNo: any } }) => {
			const survey = surveyRef.current;
			if (!survey) return;
			const currentPageNo = survey.currentPageNo;
			const targetPageNo = event.state?.pageNo;
			if (typeof targetPageNo !== 'number') return;
			if (targetPageNo < currentPageNo) survey.prevPage();
			else if (targetPageNo > currentPageNo) survey.nextPage();
		};
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	}, []);

	if (loading) return <p>Loading survey...</p>;
	if (!surveyRef.current) return <p>Survey not found.</p>;

	return (
		<>
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
