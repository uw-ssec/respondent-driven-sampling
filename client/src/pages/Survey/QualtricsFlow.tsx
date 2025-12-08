import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey as SurveyComponent } from 'survey-react-ui';
import toast from 'react-hot-toast';

import 'survey-core/survey-core.min.css';

import { SYSTEM_SURVEY_CODE } from '@/constants';
import { useAuthContext } from '@/contexts';
import { useAbility, useApi } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { useSurveyStore } from '@/stores';
import { useGeolocated } from 'react-geolocated';

import preScreenJson from './utils/preScreenQuestions.json';
import giftCardJson from './utils/giftCardQuestions.json';
import { themeJson } from './utils/surveyTheme';
import QualtricsSurvey from './components/QualtricsSurvey';

// Flow stages for the Qualtrics integration
type FlowStage = 'pre-screen' | 'qualtrics' | 'gift-card';

/**
 * QualtricsFlow Component
 * 
 * Orchestrates the survey flow with Qualtrics integration:
 * 1. Pre-screen questions (SurveyJS) - Volunteer-only questions
 * 2. Qualtrics survey (iFrame) - Main survey content
 * 3. Gift card questions (SurveyJS) - Post-survey questions
 * 4. QR code display (existing QrPage)
 */
const QualtricsFlow = () => {
	const { surveyService, seedService } = useApi();
	const [searchParams] = useSearchParams();
	const surveyCodeInUrl = searchParams.get('ref');

	const navigate = useNavigate();
	const ability = useAbility();

	const { userObjectId, lastestLocationObjectId } = useAuthContext();

	// Current flow stage
	const [flowStage, setFlowStage] = useState<FlowStage>('pre-screen');
	// Local survey code for Qualtrics
	const [localSurveyCode, setLocalSurveyCode] = useState<string | null>(null);
	// Local object ID for updating survey
	const [localObjectId, setLocalObjectId] = useState<string | null>(null);
	// Permission checked flag
	const [permissionChecked, setPermissionChecked] = useState(false);

	// Store methods
	const {
		setObjectId,
		setSurveyCode,
		setParentSurveyCode,
		setSurveyData,
		setChildSurveyCodes
	} = useSurveyStore();

	// Conditionally fetch parent survey (only when surveyCodeInUrl exists)
	const { isLoading: parentLoading } = surveyCodeInUrl
		? surveyService.useParentOfSurveyCode(surveyCodeInUrl)
		: { isLoading: false };

	useGeolocated({
		positionOptions: { enableHighAccuracy: false },
		userDecisionTimeout: 5000
	});

	// Check permissions on mount
	useEffect(() => {
		if (parentLoading || permissionChecked) return;

		if (
			!surveyCodeInUrl &&
			!ability.can(ACTIONS.CUSTOM.CREATE_WITHOUT_REFERRAL, SUBJECTS.SURVEY)
		) {
			toast.error(
				'You do not have permission to create a survey without a referral code.'
			);
			navigate('/apply-referral');
			return;
		}

		setPermissionChecked(true);
	}, [parentLoading, surveyCodeInUrl, ability, navigate, permissionChecked]);

	// Create pre-screen survey model
	const preScreenSurvey = useMemo(() => {
		if (!permissionChecked) return null;
		const surveyJson = JSON.parse(JSON.stringify(preScreenJson));
		const survey = new Model(surveyJson);
		survey.applyTheme(themeJson);
		return survey;
	}, [permissionChecked]);

	// Create gift card survey model
	const giftCardSurvey = useMemo(() => {
		if (flowStage !== 'gift-card') return null;
		const surveyJson = JSON.parse(JSON.stringify(giftCardJson));
		const survey = new Model(surveyJson);
		survey.applyTheme(themeJson);
		return survey;
	}, [flowStage]);

	// Handle pre-screen completion
	const handlePreScreenComplete = useCallback(async (sender: Model) => {
		const preScreenData = sender.data;
		console.log('Pre-screen complete, data:', preScreenData);

		try {
			const req: any = {
				createdByUserObjectId: userObjectId,
				locationObjectId: preScreenData.location || lastestLocationObjectId,
				responses: preScreenData
			};

			// Add survey code to request if it exists
			if (surveyCodeInUrl) {
				req.surveyCode = surveyCodeInUrl;
			} else {
				// Generate a new fallback seed to link to the survey
				const seed = await seedService.createSeed({
					locationObjectId: preScreenData.location,
					isFallback: true
				});
				req.surveyCode = seed.data.surveyCode;
				req.parentSurveyCode = SYSTEM_SURVEY_CODE;
			}

			// Create the survey entry
			const result = await surveyService.createSurvey(req);

			if (result) {
				console.log('Survey created:', result.data);
				const surveyCode = result.data.surveyCode;
				const objectId = result.data._id;

				// Update store
				setObjectId(objectId);
				setParentSurveyCode(result.data.parentSurveyCode);
				setSurveyCode(surveyCode);
				setSurveyData({
					objectId: objectId,
					surveyCode: surveyCode,
					parentSurveyCode: result.data.parentSurveyCode,
					responses: preScreenData
				});

				// Update local state and move to next stage
				setLocalObjectId(objectId);
				setLocalSurveyCode(surveyCode);
				console.log('Moving to qualtrics stage with surveyCode:', surveyCode);
				setFlowStage('qualtrics');
			}
		} catch (error) {
			console.error('Error saving pre-screen data:', error);
			toast.error('Failed to save pre-screen data. Please try again.');
		}
	}, [userObjectId, lastestLocationObjectId, surveyCodeInUrl, seedService, surveyService, setObjectId, setParentSurveyCode, setSurveyCode, setSurveyData]);

	// Attach pre-screen completion handler
	useEffect(() => {
		if (!preScreenSurvey) return;
		
		preScreenSurvey.onComplete.add(handlePreScreenComplete);
		
		return () => {
			preScreenSurvey.onComplete.remove(handlePreScreenComplete);
		};
	}, [preScreenSurvey, handlePreScreenComplete]);

	// Handle Qualtrics completion
	const handleQualtricsComplete = useCallback(() => {
		console.log('Qualtrics complete, moving to gift-card stage');
		setFlowStage('gift-card');
	}, []);

	// Handle gift card completion
	const handleGiftCardComplete = useCallback(async (sender: Model) => {
		const giftCardData = sender.data;
		console.log('Gift card complete, data:', giftCardData);

		try {
			// Merge gift card responses with existing responses
			const currentData = useSurveyStore.getState().surveyData;
			const mergedResponses = {
				...currentData?.responses,
				...giftCardData
			};

			// Update the survey with gift card data and mark as completed
			const result = await surveyService.updateSurvey(localObjectId!, {
				responses: mergedResponses,
				isCompleted: true
			});

			if (result?.data?.childSurveyCodes) {
				setChildSurveyCodes(result.data.childSurveyCodes);
				setSurveyData({
					...currentData,
					responses: mergedResponses,
					childSurveyCodes: result.data.childSurveyCodes
				});
				navigate('/qrcode');
			}
		} catch (error) {
			console.error('Error saving gift card data:', error);
			toast.error('Failed to save gift card data. Please try again.');
		}
	}, [localObjectId, surveyService, setChildSurveyCodes, setSurveyData, navigate]);

	// Attach gift card completion handler
	useEffect(() => {
		if (!giftCardSurvey) return;
		
		giftCardSurvey.onComplete.add(handleGiftCardComplete);
		
		return () => {
			giftCardSurvey.onComplete.remove(handleGiftCardComplete);
		};
	}, [giftCardSurvey, handleGiftCardComplete]);

	// Loading state
	if (parentLoading || !permissionChecked) {
		return <p>Loading...</p>;
	}

	// Debug log
	console.log('QualtricsFlow render:', { flowStage, localSurveyCode, localObjectId });

	// Render based on current flow stage
	return (
		<div style={{ minHeight: '100vh' }}>
			{flowStage === 'pre-screen' && preScreenSurvey && (
				<div style={{ padding: '20px' }}>
					<SurveyComponent model={preScreenSurvey} />
				</div>
			)}

			{flowStage === 'qualtrics' && localSurveyCode && (
				<QualtricsSurvey
					surveyCode={localSurveyCode}
					onComplete={handleQualtricsComplete}
				/>
			)}

			{flowStage === 'gift-card' && giftCardSurvey && (
				<div style={{ padding: '20px' }}>
					<h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
						Almost Done! Gift Card Information
					</h2>
					<SurveyComponent model={giftCardSurvey} />
				</div>
			)}
		</div>
	);
};

export default QualtricsFlow;
