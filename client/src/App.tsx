import { AuthProvider } from '@/contexts';
import NewUser from '@/pages/AdminDashboard/NewUser';
import AdminDashboard from '@/pages/AdminDashboard/StaffDashboard';
import QrPage from '@/pages/CompletedSurvey/QrPage';
import LandingPage from '@/pages/LandingPage/LandingPage';
import Login from '@/pages/Login/Login';
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
								<ProtectedRoute>
									<SurveyComponent />
								</ProtectedRoute>
							}
						/>
						<Route path="/signup" element={<Signup />} />
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<LandingPage />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/survey"
							element={
								<ProtectedRoute>
									<SurveyComponent />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/admin-dashboard"
							element={
								<ProtectedRoute>
									<AdminDashboard />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/profile/:id"
							element={
								<ProtectedRoute>
									<Profile />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/add-new-user"
							element={
								<ProtectedRoute>
									<NewUser />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/survey-entries"
							element={
								<ProtectedRoute>
									<SurveyEntryDashboard />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/qrcode"
							element={
								<ProtectedRoute>
									<QrPage />
								</ProtectedRoute>
							}
						/>
						{/* <Route
							path="/past-entries"
							element={
								<ProtectedRoute>
									<PastEntries />
								</ProtectedRoute>
							}
						/> */}
						<Route
							path="/survey/:id"
							element={
								<ProtectedRoute>
									<SurveyDetails />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/survey/:id/edit"
							element={
								<ProtectedRoute>
									<SurveyComponent />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/apply-referral"
							element={
								<ProtectedRoute>
									<ApplyReferral />
								</ProtectedRoute>
							}
						/>
					</Routes>
				</Router>
			</ThemeProvider>
		</AuthProvider>
	);
}

export default App;
