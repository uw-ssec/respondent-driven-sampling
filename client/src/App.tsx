import { AuthProvider } from '@/contexts';
import {
	Survey,
	SurveyDetails,
	SurveyEntryDashboard,
	QrPage,
	LandingPage,
	Login,
	Profile,
	ApplyReferral,
	Signup,
	StaffDashboard,
	NewUser
} from '@/pages';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import {
	Navigate,
	Route,
	BrowserRouter as Router,
	Routes
} from 'react-router-dom';
import { ProtectedRoute } from '@/components';
import { muiTheme } from '@/theme/muiTheme';
import { isTokenValid } from '@/utils/authTokenHandler';

function App() {
	return (
		<AuthProvider>
			<ThemeProvider theme={muiTheme}>
				<CssBaseline />
				<Router>
					<Routes>
						<Route path="/" element={<Navigate replace to={isTokenValid() ? '/dashboard' : '/login'} />} />
						<Route path="/login" element={<Login />} />
						<Route
							path="/survey/:id/continue"
							element={
								<ProtectedRoute>
									<Survey />
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
									<Survey />
								</ProtectedRoute>
							}
						/>
						<Route
							path="/admin-dashboard"
							element={
								<ProtectedRoute>
									<StaffDashboard />
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
									<Survey />
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
