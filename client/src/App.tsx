import { AuthProvider } from '@/contexts';
import NewUser from '@/pages/AdminDashboard/NewUser';
import AdminDashboard from '@/pages/AdminDashboard/StaffDashboard';
import QrPage from '@/pages/CompletedSurvey/QrPage';
import LandingPage from '@/pages/LandingPage/LandingPage';
import Login from '@/pages/Login/Login';
import PastEntries from '@/pages/PastEntries/PastEntries';
import SurveyDetails from '@/pages/PastEntries/SurveyDetails';
import Profile from '@/pages/Profile/Profile';
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
	return (
		<AuthProvider>
			<ThemeProvider theme={muiTheme}>
				<CssBaseline />
				<Router>
					<Routes>
						<Route
							path="/"
							element={<Navigate replace to="/login" />}
						/>
						<Route path="/login" element={<Login />} />
						<Route
							path="/survey/:id/continue"
							element={
								<ProtectedRoute
									children={<SurveyComponent />}
								/>
							}
						/>
						<Route path="/signup" element={<Signup />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute children={<LandingPage />} />
							}
						/>
						<Route
							path="/survey"
							element={
								<ProtectedRoute
									children={<SurveyComponent />}
								/>
							}
						/>
						<Route
							path="/admin-dashboard"
							element={
								<ProtectedRoute children={<AdminDashboard />} />
							}
						/>
						<Route
							path="/profile/:id"
							element={<ProtectedRoute children={<Profile />} />}
						/>
						<Route
							path="/add-new-user"
							element={<ProtectedRoute children={<NewUser />} />}
						/>
						<Route
							path="/survey-entries"
							element={
								<ProtectedRoute
									children={<SurveyEntryDashboard />}
								/>
							}
						/>
						<Route
							path="/qrcode"
							element={<ProtectedRoute children={<QrPage />} />}
						/>
						<Route
							path="/past-entries"
							element={
								<ProtectedRoute children={<PastEntries />} />
							}
						/>
						<Route
							path="/survey/:id"
							element={
								<ProtectedRoute children={<SurveyDetails />} />
							}
						/>
						<Route
							path="/survey/:id/edit"
							element={
								<ProtectedRoute
									children={<SurveyComponent />}
								/>
							}
						/>
						<Route
							path="/apply-referral"
							element={
								<ProtectedRoute children={<ApplyReferral />} />
							}
						/>
						{/* <Route
								path="/view-profile"
								element={
									<ProtectedRoute
										children={
											<ViewProfile />
										}
									/>
								}
							/> */}
					</Routes>
				</Router>
			</ThemeProvider>
		</AuthProvider>
	);
}

export default App;
