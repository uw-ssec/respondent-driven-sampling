import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';

import 'survey-core/defaultV2.min.css';

// Global Zustand store managing state of survey components
import { useSurveyStore } from '@/stores/useSurveyStore';
import { getAuthToken } from '@/utils/authTokenHandler';
import { useGeolocated } from 'react-geolocated';

import { LogoutProps } from '@/types/AuthProps';
import Header from '@/pages/Header/Header';

// This component is responsible for rendering the survey and handling its logic
// It uses the SurveyJS library to create and manage the survey
// It also handles referral code validation and geolocation
// It uses React Router for navigation and URL parameter handling
// It uses Zustand (with persist) & localstorage to manage and persist data across sessions
// It uses the useEffect hook to manage side effects, such as fetching data and updating state
// It uses the useState hook to manage component state
// It uses the useGeolocated hook to get the user's geolocation
// IMPORT SURVEY DEFINITION JSON
//import surveyJson from './survey.json';
import surveyJson from './qualtrics.json';

const SurveyComponent = ({ onLogout }: LogoutProps) => {
  const [searchParams] = useSearchParams();
  const codeInUrl = searchParams.get('ref');

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const surveyRef = useRef<Model | null>(null);

	// Pulls state values and update functions from Zustand store
	const {
		getObjectId,
		setObjectId,
		getReferredByCode,
		setReferredByCode,
		setSurveyData,
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

			// Initialize survey with empty data
			surveyRef.current = new Model(surveyJson);
			surveyRef.current.data = {};
			setSurveyData(surveyRef.current.data);

			// Use referral code if provided
			if (codeInUrl && codeInUrl !== getReferredByCode()) {
				// Check for any pre-existing survey data linked to the referral code
				const surveyData = await fetchSurveyByReferralCode(codeInUrl);
				if (surveyData) {
					// in progress survey found, populate survey with existing data
					surveyRef.current.data = surveyData.responses;
					setSurveyData(surveyData);
					setObjectId(surveyData._id);
					setReferredByCode(codeInUrl);
				}
			}

			// Attach survey events to the survey
			attachSurveyEventHandlers(surveyRef.current);
			setLoading(false);
		};
		init();
	}, [codeInUrl]);

	const fetchSurveyByReferralCode = async (code: string) => {
		
		const response = await fetch(`/api/surveys/validate-ref/${code}`, {
			headers: { Authorization: `Bearer ${getAuthToken()}` }
		});
		const data = await response.json();

		// TODO: update once backend for referral codes is upgraded
		if (response.ok) {
			return {};
		} else if (data.survey) {
			return data.survey;
		} else if (response.status == 401) {
			onLogout();
			navigate('/login');
		} else {
			alert(data.message);
			navigate('/apply-referral');
		}
	}

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
				objectId: getObjectId() ?? null,
			}
		}

		survey.onCurrentPageChanged.add(async sender => {
			pushHistoryState(sender.currentPageNo);
			
			const surveyData = { ...getSurveyData(sender.data), completed: false }
			setSurveyData(surveyData);

			try {
				const response = await fetch('/api/surveys/save', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${getAuthToken()}`
					},
					body: JSON.stringify(surveyData)
				});
								
				if (response.ok) {
					const data = await response.json();
					// set objectId in our surveyData if it is not already set
					if (getObjectId() == null) {
						setObjectId(data.objectId);
					}
				}
				else {
					console.error('Autosave failed:', await response.text());
				}
			} catch (error) {
			console.error('Autosave failed:', error);
			}
		});

		survey.onComplete.add(async sender => {
			const surveyData = { ...getSurveyData(sender.data), completed: true }
			setSurveyData(surveyData);

			try {
				const token = getAuthToken();
				const response = await fetch('/api/surveys/save', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify(surveyData)
				});

				if (response.ok) {
					const data = await response.json();
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
      <Header onLogout={onLogout} />
      <div style={{ padding: '20px' }}>
        {surveyRef.current && <Survey model={surveyRef.current} />}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px' }}>
          <div
            onClick={() => {
              if (surveyRef.current && surveyRef.current.currentPageNo > 0) {
                surveyRef.current.prevPage();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36px" height="36px">
              <circle cx="12" cy="12" r="10" fill="#3E236E" />
              <path d="M14 7l-5 5 5 5" stroke="white" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <div
            onClick={() => {
              if (surveyRef.current && !surveyRef.current.isLastPage) {
                surveyRef.current.nextPage();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36px" height="36px">
              <circle cx="12" cy="12" r="10" fill="#3E236E" />
              <path d="M10 7l5 5-5 5" stroke="white" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default SurveyComponent;