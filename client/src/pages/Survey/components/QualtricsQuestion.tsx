import React, { useEffect, useState, useCallback } from 'react';
import { ElementFactory, Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';
import { useSurveyStore } from '@/stores';

// Constants
const QUALTRICS_END_MESSAGES = ['endOfSurvey'] as const;
const DEFAULT_IFRAME_HEIGHT = '80vh';
const MIN_IFRAME_HEIGHT = '600px';
const CONFIG_ENDPOINT = '/api/config';

interface ConfigResponse {
	qualtricsSurveyUrl: string | null;
}

/**
 * Custom SurveyJS question model for embedding Qualtrics surveys.
 * This question type embeds a Qualtrics survey via iframe and listens
 * for completion signals to automatically advance to the next page.
 */
export class QuestionQualtricsModel extends Question {
	getType(): string {
		return 'qualtrics';
	}

	get surveyCodeField(): string {
		return this.getPropertyValue('surveyCodeField', 'surveyCode');
	}
	set surveyCodeField(val: string) {
		this.setPropertyValue('surveyCodeField', val);
	}

	get qualtricsCompleted(): boolean {
		return this.getPropertyValue('qualtricsCompleted', false);
	}
	set qualtricsCompleted(val: boolean) {
		this.setPropertyValue('qualtricsCompleted', val);
		if (val) {
			// Mark question as answered with completion metadata
			this.value = { completed: true, completedAt: new Date().toISOString() };
		}
	}

	// Override isEmpty to implement required validation
	isEmpty(): boolean {
		return !this.qualtricsCompleted;
	}
}

// Register the custom question type with SurveyJS
Serializer.addClass(
	'qualtrics',
	[
		{ name: 'surveyCodeField', default: 'surveyCode' }
	],
	function () {
		return new QuestionQualtricsModel('');
	},
	'question'
);

ElementFactory.Instance.registerElement('qualtrics', (name) => {
	return new QuestionQualtricsModel(name);
});

// React component to render the Qualtrics iframe
interface QualtricsQuestionProps {
	question: QuestionQualtricsModel;
}

const QualtricsQuestionComponent = ({ question }: QualtricsQuestionProps) => {
	const [qualtricsUrl, setQualtricsUrl] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [configError, setConfigError] = useState<string | null>(null);
	const [isCompleted, setIsCompleted] = useState(false);

	// Get the survey code from the Zustand store
	const { getSurveyCode } = useSurveyStore();
	const surveyCode = getSurveyCode() ?? 'unknown';

	const handleContinue = () => {
		if (question.survey && typeof (question.survey as any).nextPage === 'function') {
			(question.survey as any).nextPage();
		}
	};

	const handleManualComplete = () => {
		const confirmed = window.confirm(
			"Are you sure you've completed all questions in the survey above?\n\nOnly use this if the Continue button didn't appear automatically after finishing the survey."
		);
		if (confirmed) {
			question.qualtricsCompleted = true;
			setIsCompleted(true);
		}
	};

	// Fetch Qualtrics URL from server config
	useEffect(() => {
		const fetchConfig = async () => {
			try {
				const response = await fetch(CONFIG_ENDPOINT);
				
				if (!response.ok) {
				// Handle 500 server configuration error (missing config)
				if (response.status === 500) {
					const errorData = await response.json();
					throw new Error(errorData.message ?? 'Server configuration error');
				}
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				
				const config: ConfigResponse = await response.json();
				if (config.qualtricsSurveyUrl) {
					// Append surveyCode as query parameter for tracking
					const url = `${config.qualtricsSurveyUrl}?surveyCode=${encodeURIComponent(surveyCode)}`;
					setQualtricsUrl(url);
				} else {
					setConfigError('Qualtrics survey URL not configured on server.');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				console.error('Error fetching config:', errorMessage);
				setConfigError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};
		fetchConfig();
	}, [surveyCode]);

	// Memoized handler for Qualtrics postMessage events
	const handleQualtricsMessage = useCallback(
		(event: MessageEvent) => {
			if (!qualtricsUrl) return;

			try {
				const qualtricsOrigin = new URL(qualtricsUrl).origin;

				// Verify message origin matches Qualtrics domain
				if (event.origin !== qualtricsOrigin) return;

				// Check if this is the final end-of-survey message
				// (not intermediate page change messages like 'QualtricsEOS')
				const isEndOfSurvey =
					QUALTRICS_END_MESSAGES.includes(event.data) ||
					event.data?.message === 'endOfSurvey';

				if (isEndOfSurvey) {
					// Mark as completed but don't auto-advance
					question.qualtricsCompleted = true;
					setIsCompleted(true);
				}
			} catch (error) {
				console.error('Error handling Qualtrics message:', error);
			}
		},
		[qualtricsUrl, question]
	);

	// Listen for postMessage from Qualtrics iframe
	useEffect(() => {
		if (!qualtricsUrl) return;

		window.addEventListener('message', handleQualtricsMessage);
		return () => window.removeEventListener('message', handleQualtricsMessage);
	}, [qualtricsUrl, handleQualtricsMessage]);

	if (configError) {
		return (
			<div
				role="alert"
				style={{
					padding: '20px',
					textAlign: 'center',
					backgroundColor: '#fee',
					borderRadius: '8px',
					margin: '20px 0'
				}}
			>
				<p style={{ color: '#c33', margin: 0 }}>
					<strong>Configuration Error:</strong> {configError}
				</p>
				<p style={{ color: '#666', fontSize: '14px', marginTop: '10px' }}>
					Please ensure QUALTRICS_SURVEY_URL is set in your server environment variables.
				</p>
			</div>
		);
	}

	if (isLoading || !qualtricsUrl) {
		return (
			<div
				role="status"
				style={{
					padding: '20px',
					textAlign: 'center',
					minHeight: MIN_IFRAME_HEIGHT
				}}
			>
				<p>Loading Qualtrics survey...</p>
			</div>
		);
	}

	return (
		<div style={{ width: '100%', minHeight: MIN_IFRAME_HEIGHT, position: 'relative' }}>
			<iframe
				src={qualtricsUrl}
				title="Qualtrics Survey"
				style={{
					width: '100%',
					height: DEFAULT_IFRAME_HEIGHT,
					minHeight: MIN_IFRAME_HEIGHT,
					border: '1px solid #ddd',
					borderRadius: '8px',
					opacity: isCompleted ? 0.7 : 1,
					pointerEvents: isCompleted ? 'none' : 'auto'
				}}
				allow="geolocation"
				aria-label="Embedded Qualtrics survey"
			/>

			{/* Show continue button when completed */}
			{isCompleted && (
				<div
					style={{
						marginTop: '20px',
						textAlign: 'center',
						padding: '20px',
						backgroundColor: '#e8f5e9',
						borderRadius: '8px',
						border: '2px solid #4caf50'
					}}
				>
					<p style={{ 
						marginBottom: '15px', 
						color: '#2e7d32', 
						fontSize: '16px',
						fontWeight: 'bold'
					}}>
						✓ Survey Completed Successfully!
					</p>
					<button
						onClick={handleContinue}
						style={{
							backgroundColor: '#4caf50',
							color: 'white',
							border: 'none',
							padding: '12px 32px',
							fontSize: '16px',
							fontWeight: 'bold',
							borderRadius: '8px',
							cursor: 'pointer',
							boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
							transition: 'all 0.2s'
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.backgroundColor = '#45a049';
							e.currentTarget.style.transform = 'translateY(-2px)';
							e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.backgroundColor = '#4caf50';
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
						}}
					>
						Continue to Next Section →
					</button>
				</div>
			)}

			{/* Helper text - only show when not completed */}
			{!isCompleted && (
				<div
					style={{
						marginTop: '20px',
						textAlign: 'center',
						padding: '10px',
						backgroundColor: '#f5f5f5',
						borderRadius: '8px'
					}}
				>
					<p style={{ marginBottom: '8px', color: '#666', fontSize: '14px' }}>
						Complete the survey above to continue.
					</p>
					<button
						onClick={handleManualComplete}
						style={{
							backgroundColor: 'transparent',
							color: '#666',
							border: 'none',
							padding: '4px 8px',
							fontSize: '12px',
							cursor: 'pointer',
							textDecoration: 'underline',
							fontStyle: 'italic'
						}}
						onMouseOver={(e) => {
							e.currentTarget.style.color = '#333';
						}}
						onMouseOut={(e) => {
							e.currentTarget.style.color = '#666';
						}}
						title="Use this if you completed the survey but the continue button didn't appear"
					>
						Survey completed but continue button not showing? Click here
					</button>
				</div>
			)}
		</div>
	);
};

// SurveyJS React wrapper class
class SurveyQuestionQualtrics extends SurveyQuestionElementBase {
	get question(): QuestionQualtricsModel {
		return this.questionBase as QuestionQualtricsModel;
	}

	renderElement(): React.JSX.Element {
		return <QualtricsQuestionComponent question={this.question} />;
	}
}

// Register the React component with SurveyJS
ReactQuestionFactory.Instance.registerQuestion('qualtrics', (props: any) => {
	return React.createElement(SurveyQuestionQualtrics, props);
});

export default QuestionQualtricsModel;
