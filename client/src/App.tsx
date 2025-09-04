import { lazy, Suspense, useState } from 'react';

import {
	Navigate,
	Outlet,
	Route,
	BrowserRouter as Router,
	Routes
} from 'react-router-dom';

import { deleteAuthToken, hasAuthToken } from './utils/authTokenHandler';

// Lazy load components
const Login = lazy(() => import('@/pages/Login/Login'));
const Signup = lazy(() => import('@/pages/Signup/Signup'));
const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage'));
const SurveyComponent = lazy(
	() => import('@/components/survey/SurveyComponent')
);
const AdminDashboard = lazy(
	() => import('@/pages/AdminDashboard/StaffDashboard')
);
const AdminEditProfile = lazy(() => import('@/pages/Profile/AdminEditProfile'));
const NewUser = lazy(() => import('@/pages/AdminDashboard/NewUser'));
const SurveyEntryDashboard = lazy(
	() => import('@/pages/SurveyEntryDashboard/SurveyEntryDashboard')
);
const QrPage = lazy(() => import('@/pages/CompletedSurvey/QrPage'));
const PastEntries = lazy(() => import('@/pages/PastEntries/PastEntries'));
const SurveyDetails = lazy(() => import('@/pages/PastEntries/SurveyDetails'));
const ApplyReferral = lazy(
	() => import('@/pages/QRCodeScan&Referral/ApplyReferral')
);
const ViewProfile = lazy(() => import('@/pages/Profile/ViewProfile'));

const privateRoutes = [
	{
		path: '/dashboard',
		component: LandingPage,
		title: 'Dashboard'
	},
	{
		path: '/survey',
		component: SurveyComponent,
		title: 'Survey'
	},
	{
		path: '/admin-dashboard',
		component: AdminDashboard,
		title: 'Admin Dashboard'
	},
	{
		path: '/admin-edit-profile/:id',
		component: AdminEditProfile,
		title: 'Edit Profile'
	},
	{
		path: '/add-new-user',
		component: NewUser,
		title: 'Add New User'
	},
	{
		path: '/survey-entries',
		component: SurveyEntryDashboard,
		title: 'Survey Entries'
	},
	{
		path: '/qrcode',
		component: QrPage,
		title: 'QR Code'
	},
	{
		path: '/past-entries',
		component: PastEntries,
		title: 'Past Entries'
	},
	{
		path: '/survey/:id',
		component: SurveyDetails,
		title: 'Survey Details'
	},
	{
		path: '/apply-referral',
		component: ApplyReferral,
		title: 'Apply Referral'
	},
	{
		path: '/view-profile',
		component: ViewProfile,
		title: 'View Profile'
	}
];

// PrivateRoute component
const PrivateRoute = ({
	isAuthenticated,
	onLogout
}: {
	isAuthenticated: boolean;
	onLogout: () => void;
}) => {
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}
	return <Outlet context={{ onLogout }} />;
};

// Loading component
const LoadingSpinner = () => (
	<div className="loading-container">
		<div>Loading...</div>
	</div>
);

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(hasAuthToken());

	const handleLogin = () => {
		setIsLoggedIn(true);
	};

	const handleLogout = () => {
		setIsLoggedIn(false);
		deleteAuthToken();
	};

	return (
		<Router>
			<Suspense fallback={<LoadingSpinner />}>
				<Routes>
					{/* Default route */}
					<Route
						path="/"
						element={<Navigate replace to="/login" />}
					/>

					<Route
						path="/login"
						element={<Login onLogin={handleLogin} />}
					/>
					<Route path="/signup" element={<Signup />} />

					{/* Protected routes */}
					<Route
						element={
							<PrivateRoute
								isAuthenticated={isLoggedIn}
								onLogout={handleLogout}
							/>
						}
					>
						{privateRoutes.map(({ path, component: Component }) => (
							<Route
								key={path}
								path={path}
								element={<Component onLogout={handleLogout} />}
							/>
						))}
					</Route>
				</Routes>
			</Suspense>
		</Router>
	);
}

export default App;
