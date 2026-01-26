import { useAbility } from '@/hooks';
import { ACTIONS, SUBJECTS } from '@/permissions/constants';
import { subject } from '@casl/ability';
import {
	Button,
	Chip,
	TableCell,
	TableRow,
	Tooltip
	// Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { SurveyDocument } from '@/types/Survey';

import { toPacificDateTimeString } from '../utils/SurveyEntryDashboardUtils';

interface SurveyEntryDashboardRowProps {
	survey: SurveyDocument;
}

export default function SurveyEntryDashboardRow({
	survey
}: SurveyEntryDashboardRowProps) {
	const navigate = useNavigate();
	const ability = useAbility();

	const canUpdate = ability.can(
		ACTIONS.CASL.UPDATE,
		subject(SUBJECTS.SURVEY, survey)
	);

	return (
		<TableRow hover sx={{ '&:hover': { backgroundColor: '#f8f8f8' } }}>
			<TableCell>{toPacificDateTimeString(survey.createdAt)}</TableCell>
			<TableCell>{survey.surveyCode ?? 'N/A'}</TableCell>
			<TableCell>{survey.locationName ?? 'N/A'}</TableCell>
			<TableCell>{survey.employeeName}</TableCell>
			<TableCell>
				{survey.responses?.first_two_letters_fname ?? 'N/A'}
			</TableCell>
			<TableCell>
				{survey.responses?.first_two_letters_lname ?? 'N/A'}
			</TableCell>
			<TableCell>{survey.responses?.date_of_birth ?? 'N/A'}</TableCell>
			<TableCell>
				{/* TODO: add some kind of permission check/unlocking functionality here for admin */}
				{survey.isCompleted ? (
					<Chip
						label="Submitted"
						variant="outlined"
						color="success"
						size="small"
					/>
				) : (
					<Tooltip
						title={
							canUpdate
								? ''
								: 'You do not have permission to continue this survey'
						}
						arrow
						placement="top"
					>
						<span>
							<Button
								size="small"
								variant="outlined"
								disabled={!canUpdate}
								onClick={() =>
									navigate(`/survey/${survey._id}/continue`)
								}
								sx={{ textTransform: 'none' }}
							>
								Continue
							</Button>
						</span>
					</Tooltip>
				)}
			</TableCell>
			<TableCell>
				<Button
					size="small"
					variant="contained"
					onClick={() => navigate(`/survey/${survey._id}`)}
					sx={{
						textTransform: 'none',
						backgroundColor: '#3E236E',
						'&:hover': { backgroundColor: '#5F2A96' }
					}}
				>
					View Details
				</Button>
			</TableCell>
		</TableRow>
	);
}
