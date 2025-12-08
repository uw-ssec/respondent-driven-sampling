import React, { useEffect, useState } from 'react';
import { ElementFactory, Question, Serializer } from 'survey-core';
import { SurveyQuestionElementBase, ReactQuestionFactory } from 'survey-react-ui';

// Define the custom question model
export class QuestionQualtricsModel extends Question {
	getType() {
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
			// Set the question value to mark it as answered
			this.value = { completed: true, completedAt: new Date().toISOString() };
		}
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

	// Get the survey code from the parent survey's data
	// Cast to Model to access getValue method
	const surveyModel = question.survey as any;
	const surveyCode = surveyModel?.getVariable?.('surveyCode') || 
		surveyModel?.getValue?.(question.surveyCodeField) ||
		'unknown';

	// Fetch Qualtrics URL from server config
	useEffect(() => {
		const fetchConfig = async () => {
			try {
				const response = await fetch('/api/config');
				if (!response.ok) {
					throw new Error('Failed to fetch config');
				}
				const config = await response.json();
				if (config.qualtricsSurveyUrl) {
					// Append surveyCode as query parameter
					const url = `${config.qualtricsSurveyUrl}?surveyCode=${encodeURIComponent(surveyCode)}`;
					setQualtricsUrl(url);
				} else {
					setConfigError('Qualtrics survey URL not configured on server.');
				}
			} catch (error) {
				console.error('Error fetching config:', error);
				setConfigError('Failed to load configuration from server.');
			} finally {
				setIsLoading(false);
			}
		};
		fetchConfig();
	}, [surveyCode]);

	// Listen for postMessage from Qualtrics
	useEffect(() => {
		if (!qualtricsUrl) return;

		const handleMessage = (event: MessageEvent) => {
			try {
				const qualtricsOrigin = new URL(qualtricsUrl).origin;
				
				if (event.origin === qualtricsOrigin) {
					if (
						event.data === 'QualtricsEOS' ||
						event.data === 'surveyComplete' ||
						event.data?.type === 'surveyComplete' ||
						event.data?.status === 'complete'
					) {
						question.qualtricsCompleted = true;
					}
				}
			} catch (error) {
				console.error('Error parsing Qualtrics message:', error);
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [qualtricsUrl, question]);

	if (configError) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<p style={{ color: 'red' }}>
					Error: {configError}
					<br />
					Please set QUALTRICS_SURVEY_URL in your server environment variables.
				</p>
			</div>
		);
	}

	if (isLoading || !qualtricsUrl) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<p>Loading Qualtrics survey...</p>
			</div>
		);
	}

	return (
		<div style={{ width: '100%', minHeight: '600px', position: 'relative' }}>
			<iframe
				src={qualtricsUrl}
				title="Qualtrics Survey"
				style={{
					width: '100%',
					height: '80vh',
					minHeight: '600px',
					border: '1px solid #ddd',
					borderRadius: '8px'
				}}
				allow="geolocation"
			/>
			
			{/* Instruction text */}
			<div style={{ 
				marginTop: '20px', 
				textAlign: 'center',
				padding: '10px',
				backgroundColor: '#f5f5f5',
				borderRadius: '8px'
			}}>
				<p style={{ marginBottom: '0', color: '#666', fontSize: '14px' }}>
					After completing the Qualtrics survey above, click <strong>Next</strong> below.
				</p>
			</div>
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
