import { useEffect, useState } from 'react';

import {
	AlertCircle,
	CheckCircle,
	Clock,
	Send,
	Wifi,
	WifiOff
} from 'lucide-react';

interface FormData {
	id: string;
	name: string;
	timestamp: number;
}

interface QueuedSubmission extends FormData {
	status: 'pending' | 'syncing' | 'synced' | 'failed';
}

const STORAGE_KEY = 'offline_form_queue';

// Mock API function - replace with your actual API endpoint
const submitToDatabase = async (data: FormData): Promise<boolean> => {
	// Simulate API call with random delay and occasional failures
	await new Promise(resolve =>
		setTimeout(resolve, 1000 + Math.random() * 2000)
	);

	// Simulate 10% failure rate for demonstration
	if (Math.random() < 0.1) {
		throw new Error('Database connection failed');
	}

	console.log('Submitted to database:', data);
	return true;
};

export default function OfflineFormExample() {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [formData, setFormData] = useState({
		name: ''
	});
	const [queuedSubmissions, setQueuedSubmissions] = useState<
		QueuedSubmission[]
	>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Load queued submissions from localStorage on component mount
	useEffect(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				setQueuedSubmissions(JSON.parse(saved));
			} catch (error) {
				console.error('Failed to parse saved submissions:', error);
			}
		}
	}, []);

	// Save queued submissions to localStorage whenever they change
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(queuedSubmissions));
	}, [queuedSubmissions]);

	// Listen for online/offline events
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	// Auto-sync when coming back online
	useEffect(() => {
		if (
			isOnline &&
			queuedSubmissions.some(sub => sub.status === 'pending')
		) {
			syncQueuedSubmissions();
		}
	}, [isOnline]);

	const syncQueuedSubmissions = async () => {
		const pendingSubmissions = queuedSubmissions.filter(
			sub => sub.status === 'pending'
		);

		for (const submission of pendingSubmissions) {
			// Update status to syncing
			setQueuedSubmissions(prev =>
				prev.map(sub =>
					sub.id === submission.id
						? { ...sub, status: 'syncing' }
						: sub
				)
			);

			try {
				await submitToDatabase(submission);

				// Mark as synced
				setQueuedSubmissions(prev =>
					prev.map(sub =>
						sub.id === submission.id
							? { ...sub, status: 'synced' }
							: sub
					)
				);
			} catch (error) {
				console.error('Failed to sync submission:', error);

				// Mark as failed, will retry later
				setQueuedSubmissions(prev =>
					prev.map(sub =>
						sub.id === submission.id
							? { ...sub, status: 'failed' }
							: sub
					)
				);
			}
		}
	};

	const handleSubmit = async () => {
		if (!formData.name) {
			alert('Please fill in all fields');
			return;
		}

		setIsSubmitting(true);

		const submission: FormData = {
			id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			name: formData.name,
			timestamp: Date.now()
		};

		if (isOnline) {
			// Try to submit directly to database
			try {
				await submitToDatabase(submission);

				// Add to queue as synced for display purposes
				setQueuedSubmissions(prev => [
					...prev,
					{ ...submission, status: 'synced' }
				]);

				// Clear form
				setFormData({ name: '' });
			} catch (error) {
				console.error('Direct submission failed:', error);

				// Fall back to queuing for later
				setQueuedSubmissions(prev => [
					...prev,
					{ ...submission, status: 'pending' }
				]);
				setFormData({ name: '' });
			}
		} else {
			// Queue for later when online
			setQueuedSubmissions(prev => [
				...prev,
				{ ...submission, status: 'pending' }
			]);
			setFormData({ name: '' });
		}

		setIsSubmitting(false);
	};

	const clearSyncedSubmissions = () => {
		setQueuedSubmissions(prev =>
			prev.filter(sub => sub.status !== 'synced')
		);
	};

	const getStatusIcon = (status: QueuedSubmission['status']) => {
		switch (status) {
			case 'pending':
				return <Clock className="w-4 h-4 text-yellow-500" />;
			case 'syncing':
				return (
					<div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
				);
			case 'synced':
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case 'failed':
				return <AlertCircle className="w-4 h-4 text-red-500" />;
		}
	};

	const getStatusText = (status: QueuedSubmission['status']) => {
		switch (status) {
			case 'pending':
				return 'Queued for sync';
			case 'syncing':
				return 'Syncing...';
			case 'synced':
				return 'Synced to database';
			case 'failed':
				return 'Sync failed - will retry';
		}
	};

	return (
		<div className="max-w-2xl mx-auto p-6 bg-white">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					Offline Form Example
				</h1>

				{/* Connection Status */}
				<div
					className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
						isOnline
							? 'bg-green-100 text-green-800'
							: 'bg-red-100 text-red-800'
					}`}
				>
					{isOnline ? (
						<Wifi className="w-4 h-4" />
					) : (
						<WifiOff className="w-4 h-4" />
					)}
					{isOnline ? 'Online' : 'Offline'}
				</div>
			</div>

			{/* Form */}
			<div className="space-y-4 mb-8">
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Name
					</label>
					<input
						type="text"
						id="name"
						value={formData.name}
						onChange={e =>
							setFormData(prev => ({
								...prev,
								name: e.target.value
							}))
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Enter your name"
					/>
				</div>

				<button
					type="button"
					onClick={handleSubmit}
					disabled={isSubmitting}
					className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{isSubmitting ? (
						<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
					) : (
						<Send className="w-4 h-4" />
					)}
					{isSubmitting ? 'Submitting...' : 'Submit'}
				</button>
			</div>

			{/* Submission Queue */}
			{queuedSubmissions.length > 0 && (
				<div className="bg-gray-50 p-4 rounded-lg">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-lg font-medium text-gray-900">
							Submission Queue ({queuedSubmissions.length})
						</h2>
						{queuedSubmissions.some(
							sub => sub.status === 'synced'
						) && (
							<button
								onClick={clearSyncedSubmissions}
								className="text-sm text-blue-600 hover:text-blue-800"
							>
								Clear synced items
							</button>
						)}
					</div>

					<div className="space-y-3">
						{queuedSubmissions.map(submission => (
							<div
								key={submission.id}
								className="bg-white p-3 rounded border flex items-center gap-3"
							>
								{getStatusIcon(submission.status)}

								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900 truncate">
										{submission.name}
									</p>
									<p className="text-xs text-gray-400">
										{new Date(
											submission.timestamp
										).toLocaleString()}
									</p>
								</div>

								<div className="text-xs text-gray-500">
									{getStatusText(submission.status)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Instructions */}
			<div className="mt-8 p-4 bg-blue-50 rounded-lg">
				<h3 className="text-sm font-medium text-blue-900 mb-2">
					How it works:
				</h3>
				<ul className="text-sm text-blue-800 space-y-1">
					<li>
						• When online: Forms submit directly to the database (currently a Mock API)
					</li>
					<li>• When offline: Forms are queued locally</li>
					<li>• Auto-sync happens when connection is restored</li>
					<li>
						• Try going offline (disconnect internet) to test the
						queue
					</li>
				</ul>
			</div>
			<div className="mt-8 p-4 bg-blue-50 rounded-lg">
				<h3 className="text-sm font-medium text-blue-900 mb-2">
					Pending Items for Future Implementation:
				</h3>
				<ul className="text-sm text-blue-800 space-y-1">
					<li>
						• Replace localStorage with IndexedDB (see Dexie that is already part of package.json)
					</li>
					<li>• Local UI Feedback: Always indicate to people when the app is offline and that data is saved locally. Display clear error/success messages for sync status.</li>
					<li>• Security: Never store sensitive data unencrypted in the browser.</li>
					<li>
						• Testing: Thoroughly test offline scenarios by simulating connectivity losses and data sync behaviors
					</li>
				</ul>
			</div>
		</div>
	);
}
