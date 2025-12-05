import { useEffect, useRef } from 'react';

import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey as SurveyComponent } from 'survey-react-ui';

import 'survey-core/survey-core.min.css';

import { SYSTEM_SURVEY_CODE } from '@/constants';
import { useAuthContext } from '@/contexts';
import { useAbility, useApi } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { useSurveyStore } from '@/stores';
import { useGeolocated } from 'react-geolocated';
import toast from 'react-hot-toast';

import { SurveyDocument } from '@/types/Survey';

import { initializeSurvey } from './utils/surveyUtils';

// This component is responsible for rendering the survey and handling its logic
// It uses the SurveyJS library to create and manage the survey
// It also handles referral code validation and geolocation
// It uses React Router for navigation and URL parameter handling
// It uses Zustand (with persist) & localstorage to manage and persist data across sessions
// It uses the useEffect hook to manage side effects, such as fetching data and updating state
// It uses the useGeolocated hook to get the user's geolocation
const Survey = () => {
	const { surveyService, seedService } = useApi();
	const [searchParams] = useSearchParams();
	const surveyCodeInUrl = searchParams.get('ref');
	const { id: surveyObjectIdInUrl } = useParams();
	const isEditMode = window.location.pathname.includes('/edit');

	const navigate = useNavigate();
	const surveyRef = useRef<Model | null>(null);
	const isInitialized = useRef(false);
	const ability = useAbility();

	const { userObjectId, userRole, lastestLocationObjectId } =
		useAuthContext();

	// Add a ref to store the original full survey data in edit mode
	const originalSurveyData = useRef<any>(null);

	// Conditionally fetch survey by referral code (only when surveyCodeInUrl exists)
	const { data: surveyByRefCode, isLoading: surveyByRefLoading } =
		surveyCodeInUrl
			? surveyService.useSurveyBySurveyCode(surveyCodeInUrl)
			: {};

	// If surveyCodeInUrl exists, it should be conntected to EITHER a parent survey or a seed. Check for both.
	// Conditionally fetch parent survey (only when surveyCodeInUrl exists)
	const { data: parentSurvey, isLoading: parentLoading } = surveyCodeInUrl
		? surveyService.useParentOfSurveyCode(surveyCodeInUrl)
		: {};

	// Conditionally fetch seed (only when surveyCodeInUrl exists)
	// const { data: seed, isLoading: seedLoading } = surveyCodeInUrl
	// 	? seedService.useSeedBySurveyCode(surveyCodeInUrl)
	// 	: {};

	// Conditionally fetch survey by object id (only when surveyObjectIdInUrl exists)
	const { data: surveyByObjectId, isLoading: surveyByObjectIdLoading } =
		surveyObjectIdInUrl ? surveyService.useSurvey(surveyObjectIdInUrl) : {};

	// Store methods
	const {
		getObjectId,
		setObjectId,
		setSurveyCode,
		getParentSurveyCode,
		setParentSurveyCode,
		setSurveyData,
		setChildSurveyCodes
	} = useSurveyStore();

	const { coords } = useGeolocated({
		positionOptions: { enableHighAccuracy: false },
		userDecisionTimeout: 5000
	});

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
			// In edit mode, merge with original data to preserve all fields
			const responses =
				isEditMode && originalSurveyData.current
					? { ...originalSurveyData.current, ...data }
					: (data ?? {});

			return {
				responses,
				parentSurveyCode: getParentSurveyCode() ?? null,
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
						locationObjectId:
							surveyData.responses.location ??
							lastestLocationObjectId,
						responses: surveyData.responses
					};
					// Add survey code to request if it exists
					if (surveyCodeInUrl) {
						req.surveyCode = surveyCodeInUrl;
					} else {
						// Generate a new fallback seed to link to the survey
						const seed = await seedService.createSeed({
							locationObjectId: surveyData.responses.location,
							isFallback: true
						});
						// Set the survey code as the fallback seed code
						// Set the parent survey code as the system survey code seed
						req.surveyCode = seed?.surveyCode as string;
						req.parentSurveyCode = SYSTEM_SURVEY_CODE;
					}
					result = await surveyService.createSurvey(req);
				} else {
					result = await surveyService.updateSurvey(getObjectId()!, {
						responses: surveyData.responses // Now includes merged data
					});
				}
				if (result) {
					setObjectId(result._id);
					setParentSurveyCode(result.parentSurveyCode);
					setSurveyCode(result.surveyCode);
				}
			} catch (error) {
				// TODO: handle error (e.g., show notification as toast messages)
				console.error('Autosave failed:', error);
			}
		});

		survey.onComplete.add(async sender => {
			const surveyData = {
				...getSurveyData(sender.data), // Merging happens here too
				completed: true
			};
			setSurveyData(surveyData);

			try {
				const result = await surveyService.updateSurvey(
					getObjectId() as string,
					{
						responses: surveyData.responses,
						isCompleted: true
					}
				);

				if (isEditMode) {
					// TODO: handle revoking consent edits
					navigate(`/survey/${getObjectId()}`);
					return;
				}

				if (result && result.childSurveyCodes) {
					setChildSurveyCodes(result.childSurveyCodes);
					navigate('/qrcode');
					return;
				}
			} catch (error) {
				// TODO: handle error (e.g., show notification)
				console.error('Error saving survey:', error);
			}
		});
	};

	// Check if all required data is loaded
	const isDataReady =
		(!surveyCodeInUrl || !surveyByRefLoading) &&
		!parentLoading &&
		!surveyByObjectIdLoading;

	// Single, clean useEffect for survey initialization
	useEffect(() => {
		// Prevent re-initialization if already done
		if (isInitialized.current) return;

		// Wait for all data to be ready
		if (!isDataReady) return;

		// The UI should try to never actually reach this point, because surveys get filtered in SurveyEntryDashboard based on permissions.
		if (surveyByObjectId) {
			if (
				userObjectId &&
				(userRole === 'VOLUNTEER' || userRole === 'MANAGER') &&
				surveyByObjectId.createdByUserObjectId !== userObjectId
			) {
				toast.error(
					'You do not have permission to continue this survey because you are not the creator.'
				);
				navigate('/survey-entries');
				//window.location.reload(); // Forces a full page reload to reset state
				return;
			}
		}

		if (
			!surveyCodeInUrl &&
			!ability.can(
				ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL,
				SUBJECTS.SURVEY
			)
		) {
			toast.error(
				'You do not have permission to create a survey without a referral code.'
			);
			navigate('/apply-referral');
			return;
		}

		// Initialize the survey
		const { survey, existingData } = initializeSurvey(
			locations,
			surveyByRefCode as SurveyDocument | null,
			surveyByObjectId as SurveyDocument | null,
			parentSurvey as SurveyDocument | null,
			isEditMode
		);
		surveyRef.current = survey;

		// Store original full survey data in edit mode
		if (isEditMode && surveyByObjectId) {
			originalSurveyData.current = { ...surveyByObjectId.responses };
		}

		// Set survey data in store
		if (existingData) {
			setSurveyData(existingData.surveyData);
			setObjectId(existingData.objectId);
			setParentSurveyCode(existingData.parentSurveyCode as string);
		} else {
			setSurveyData(survey.data);
			setParentSurveyCode(parentSurvey?.surveyCode as string);
		}

		// Attach event handlers
		attachSurveyEventHandlers(survey);

		// Mark as initialized
		isInitialized.current = true;
	}, [
		isDataReady,
		surveyCodeInUrl,
		surveyByRefCode,
		surveyByObjectId,
		parentSurvey,
		ability
	]);

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

	// Loading state (need to fetch all data)
	const isLoading =
		(surveyCodeInUrl && surveyByRefLoading) ||
		parentLoading ||
		// seedLoading ||
		surveyByObjectIdLoading;

	if (isLoading) return <p>Loading survey...</p>;
	if (!surveyRef.current) return <p>Survey not found.</p>;

	return (
		<>
			<div style={{ padding: '20px' }}>
				{surveyRef.current && (
					<SurveyComponent model={surveyRef.current} />
				)}
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

export default Survey;
