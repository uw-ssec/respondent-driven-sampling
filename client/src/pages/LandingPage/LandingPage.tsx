import { useAbility } from '@/hooks';
import { useNavigate } from 'react-router-dom';

import '@/styles/LandingPage.css';

import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { isCreatedBySelf } from '@/permissions/utils';
import { useAuthStore } from '@/stores';
import { subject } from '@casl/ability';
import Container from '@mui/material/Container';

export default function LandingPage() {
	const navigate = useNavigate();
	const { firstName, userObjectId } = useAuthStore();
	const ability = useAbility();

	// Function to handle navigation to the survey page
	return (
		<>
			{/* Main landing container */}
			<Container maxWidth="md" sx={{ mt: 4 }}>
				<h1 className="welcome-text">Welcome back, {firstName}!</h1>

				<div className="actions-box">
					<h2>Your Actions:</h2>
					<div>
						{ability.can(
							ACTIONS.CASL.UPDATE,
							SUBJECTS.USER,
							'approvalStatus'
						) && (
							<button
								className="action-button view-dashboard"
								onClick={() => navigate('/admin-dashboard')}
							>
								View Staff Dashboard
							</button>
						)}
						{ability.can(ACTIONS.CASL.CREATE, SUBJECTS.SURVEY) && (
							<button
								className="action-button scan-referral"
								onClick={() => navigate('/apply-referral')}
							>
								New Entry
							</button>
						)}

						{ability.can(
							ACTIONS.CASL.READ,
							subject('Survey', isCreatedBySelf(userObjectId))
						) && (
							<button
								className="action-button"
								onClick={() => navigate('/past-entries')}
							>
								View Your Entries
							</button>
						)}
						{ability.can(
							ACTIONS.CASL.READ,
							subject('Survey', {
								$ne: isCreatedBySelf(userObjectId)
							})
						) && (
							<button
								className="action-button"
								onClick={() => navigate('/survey-entries')}
							>
								View Survey Entries
							</button>
						)}
					</div>
				</div>
			</Container>
		</>
	);
}
