import { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import NewUser from '@/pages/AdminDashboard/NewUser';
import AdminDashboard from '@/pages/AdminDashboard/StaffDashboard';
import QrPage from '@/pages/CompletedSurvey/QrPage';
import LandingPage from '@/pages/LandingPage/LandingPage';
import Login from '@/pages/Login/Login';
import PastEntries from '@/pages/PastEntries/PastEntries';
import SurveyDetails from '@/pages/PastEntries/SurveyDetails';
import AdminEditProfile from '@/pages/Profile/AdminEditProfile';
import ViewProfile from '@/pages/Profile/ViewProfile';
import ApplyReferral from '@/pages/QRCodeScanAndReferral/ApplyReferral';
import Signup from '@/pages/Signup/Signup';
import SurveyEntryDashboard from '@/pages/SurveyEntryDashboard/SurveyEntryDashboard';
import SurveyEdit from '@/pages/PastEntries/SurveyEdit';
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes
} from 'react-router-dom';

import SurveyComponent from '@/pages/Survey/SurveyComponent';
import { muiTheme } from './theme/muiTheme';

import { hasAuthToken } from './utils/authTokenHandler';
import { useSurveyStore } from './stores/useSurveyStore';
import { useAuthStore } from './stores/useAuthStore';

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(hasAuthToken());

	const handleLogin = () => {
		setIsLoggedIn(true);
	};

	const handleLogout = () => {
		setIsLoggedIn(false);
		// Clear auth and survey storage upon logout
		useAuthStore.getState().clearSession();
		useSurveyStore.getState().clearSession();
	};

	return (
		<ThemeProvider theme={muiTheme}>
			<CssBaseline />
			<Router>
				<Routes>
					<Route path="/" element={<Navigate replace to="/login" />} />
					<Route
						path="/login"
						element={<Login onLogin={handleLogin} />}
					/>
					<Route path="/survey/:id/survey"
						element={
							isLoggedIn ? (
							<SurveyComponent onLogout={handleLogout} />
							) : (
							<Navigate replace to="/login" />
							)
						}
					/>
					<Route path="/signup" element={<Signup />} />
					<Route
						path="/dashboard"
						element={
							isLoggedIn ? (
								<LandingPage onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/survey"
						element={
							isLoggedIn ? (
								<SurveyComponent onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/admin-dashboard"
						element={
							isLoggedIn ? (
								<AdminDashboard onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/admin-edit-profile/:id"
						element={
							isLoggedIn ? (
								<AdminEditProfile onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/add-new-user"
						element={
							isLoggedIn ? (
								<NewUser onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/survey-entries"
						element={
							isLoggedIn ? (
								<SurveyEntryDashboard onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/qrcode"
						element={
							isLoggedIn ? (
								<QrPage onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/past-entries"
						element={
							isLoggedIn ? (
								<PastEntries onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/survey/:id"
						element={
							isLoggedIn ? (
								<SurveyDetails onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/survey/:id/edit"
						element={
							isLoggedIn ? (
								<SurveyEdit />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/apply-referral"
						element={
							isLoggedIn ? (
								<ApplyReferral onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
					<Route
						path="/view-profile"
						element={
							isLoggedIn ? (
								<ViewProfile onLogout={handleLogout} />
							) : (
								<Navigate replace to="/login" />
							)
						}
					/>
				</Routes>
			</Router>
		</ThemeProvider>
	);
}

export default App;
