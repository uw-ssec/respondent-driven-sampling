import { useEffect, useRef, useState } from 'react';

interface QualtricsSurveyProps {
	surveyCode: string;
	onComplete: () => void;
}

/**
 * QualtricsSurvey Component
 * Embeds a Qualtrics survey in an iFrame and listens for completion.
 * 
 * The surveyCode is passed as a URL parameter which can be captured
 * in Qualtrics as an embedded data field.
 * 
 * Qualtrics setup instructions:
 * 1. In Survey Flow, add an Embedded Data element at the start
 * 2. Add a field named "surveyCode" (it will auto-capture from URL)
 * 3. In Survey Options > End of Survey, enable "Redirect to URL" or use custom End of Survey message
 * 4. To enable postMessage completion detection, add this JavaScript in Qualtrics:
 *    - Go to Look & Feel > General > Header/Footer
 *    - Add custom JavaScript that sends postMessage on survey end
 */
const QualtricsSurvey = ({ surveyCode, onComplete }: QualtricsSurveyProps) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [qualtricsBaseUrl, setQualtricsBaseUrl] = useState<string | null>(null);
	const [configError, setConfigError] = useState<string | null>(null);

	// Fetch Qualtrics URL from server config on mount
	useEffect(() => {
		const fetchConfig = async () => {
			try {
				const response = await fetch('/api/config');
				if (!response.ok) {
					throw new Error('Failed to fetch config');
				}
				const config = await response.json();
				if (config.qualtricsSurveyUrl) {
					setQualtricsBaseUrl(config.qualtricsSurveyUrl);
				} else {
					setConfigError('Qualtrics survey URL not configured on server.');
				}
			} catch (error) {
				console.error('Error fetching config:', error);
				setConfigError('Failed to load configuration from server.');
			}
		};
		fetchConfig();
	}, []);

	// Construct full URL with surveyCode as query parameter
	const qualtricsSurveyUrl = qualtricsBaseUrl 
		? `${qualtricsBaseUrl}?surveyCode=${encodeURIComponent(surveyCode)}`
		: null;

	useEffect(() => {
		// Listen for postMessage from Qualtrics iframe
		const handleMessage = (event: MessageEvent) => {
			// Verify origin matches Qualtrics domain for security
			// You may need to adjust this based on your Qualtrics instance URL
			if (!qualtricsBaseUrl) return;

			try {
				const qualtricsOrigin = new URL(qualtricsBaseUrl).origin;
				
				// Check if message is from Qualtrics
				if (event.origin === qualtricsOrigin) {
					// Qualtrics can send various message types
					// Common completion signals: 'QualtricsEOS', 'surveyComplete', or custom messages
					if (
						event.data === 'QualtricsEOS' ||
						event.data === 'surveyComplete' ||
						event.data?.type === 'surveyComplete' ||
						event.data?.status === 'complete'
					) {
						onComplete();
					}
				}
			} catch (error) {
				console.error('Error parsing Qualtrics message:', error);
			}
		};

		window.addEventListener('message', handleMessage);

		return () => {
			window.removeEventListener('message', handleMessage);
		};
	}, [qualtricsBaseUrl, onComplete]);

	const handleIframeLoad = () => {
		setIsLoading(false);
	};

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

	if (!qualtricsBaseUrl) {
		return (
			<div style={{ padding: '20px', textAlign: 'center' }}>
				<p>Loading configuration...</p>
			</div>
		);
	}

	return (
		<div style={{ width: '100%', height: '100vh', position: 'relative' }}>
			{isLoading && (
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						zIndex: 10
					}}
				>
					<p>Loading Qualtrics survey...</p>
				</div>
			)}
			<iframe
				ref={iframeRef}
				src={qualtricsSurveyUrl || ''}
				title="Qualtrics Survey"
				onLoad={handleIframeLoad}
				style={{
					width: '100%',
					height: '100%',
					border: 'none',
					opacity: isLoading ? 0 : 1,
					transition: 'opacity 0.3s ease'
				}}
				allow="geolocation"
			/>
			
			{/* Manual completion button as fallback */}
			<div
				style={{
					position: 'fixed',
					bottom: '20px',
					right: '20px',
					zIndex: 100
				}}
			>
				<button
					onClick={onComplete}
					style={{
						padding: '12px 24px',
						backgroundColor: '#3E236E',
						color: 'white',
						border: 'none',
						borderRadius: '8px',
						cursor: 'pointer',
						fontSize: '14px',
						boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
					}}
				>
					Continue to Gift Card Questions →
				</button>
			</div>
		</div>
	);
};

export default QualtricsSurvey;
