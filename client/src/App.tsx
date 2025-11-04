import { AbilityContext, AuthProvider } from '@/contexts';
import { useAbility, useAuth } from '@/hooks';
import NewUser from '@/pages/AdminDashboard/NewUser';
import AdminDashboard from '@/pages/AdminDashboard/StaffDashboard';
import QrPage from '@/pages/CompletedSurvey/QrPage';
import LandingPage from '@/pages/LandingPage/LandingPage';
import Login from '@/pages/Login/Login';
import PastEntries from '@/pages/PastEntries/PastEntries';
import SurveyDetails from '@/pages/PastEntries/SurveyDetails';
import SurveyEdit from '@/pages/PastEntries/SurveyEdit';
import AdminEditProfile from '@/pages/Profile/AdminEditProfile';
import ViewProfile from '@/pages/Profile/ViewProfile';
import ApplyReferral from '@/pages/QRCodeScanAndReferral/ApplyReferral';
import Signup from '@/pages/Signup/Signup';
import SurveyComponent from '@/pages/Survey/SurveyComponent';
import SurveyEntryDashboard from '@/pages/SurveyEntryDashboard/SurveyEntryDashboard';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes
} from 'react-router-dom';

import { ProtectedRoute } from './components/ProtectedRoute';
import { muiTheme } from './theme/muiTheme';

function App() {
	const { isLoggedIn, handleLogin, handleLogout } = useAuth();
	const ability = useAbility();

	return (
		<AuthProvider value={{ onLogout: handleLogout, isLoggedIn }}>
			<AbilityContext.Provider value={ability}>
				<ThemeProvider theme={muiTheme}>
					<CssBaseline />
					<Router>
						<Routes>
							<Route
								path="/"
								element={<Navigate replace to="/login" />}
							/>
							<Route
								path="/login"
								element={<Login onLogin={handleLogin} />}
							/>
							<Route
								path="/survey/:id/survey"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<SurveyComponent />}
									/>
								}
							/>
							<Route path="/signup" element={<Signup />} />
							<Route
								path="/dashboard"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<LandingPage />}
									/>
								}
							/>
							<Route
								path="/survey"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<SurveyComponent />}
									/>
								}
							/>
							<Route
								path="/admin-dashboard"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<AdminDashboard />}
									/>
								}
							/>
							<Route
								path="/admin-edit-profile/:id"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<AdminEditProfile />}
									/>
								}
							/>
							<Route
								path="/add-new-user"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<NewUser />}
									/>
								}
							/>
							<Route
								path="/survey-entries"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<SurveyEntryDashboard />}
									/>
								}
							/>
							<Route
								path="/qrcode"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<QrPage />}
									/>
								}
							/>
							<Route
								path="/past-entries"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<PastEntries />}
									/>
								}
							/>
							<Route
								path="/survey/:id"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<SurveyDetails />}
									/>
								}
							/>
							<Route
								path="/survey/:id/edit"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<SurveyEdit />}
									/>
								}
							/>
							<Route
								path="/apply-referral"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={<ApplyReferral />}
									/>
								}
							/>
							<Route
								path="/view-profile"
								element={
									<ProtectedRoute
										isLoggedIn={isLoggedIn}
										children={
											<ViewProfile />
										}
									/>
								}
							/>
						</Routes>
					</Router>
				</ThemeProvider>
			</AbilityContext.Provider>
		</AuthProvider>
	);
}

export default App;
