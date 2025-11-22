import {
	Button,
	Chip,
	TableCell,
	TableRow
	// Tooltip,
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

	return (
		<TableRow hover sx={{ '&:hover': { backgroundColor: '#f8f8f8' } }}>
			<TableCell>{toPacificDateTimeString(survey.createdAt)}</TableCell>
			{/* <TableCell>
				<Tooltip title={survey.employeeId} arrow>
					<Typography
						variant="body2"
						sx={{
							fontSize: '0.85rem',
							maxWidth: '90px',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap'
						}}
					>
						{survey.employeeId}
					</Typography>
				</Tooltip>
			</TableCell> */}
			<TableCell>{survey.employeeName}</TableCell>
			<TableCell>{survey.locationName ?? 'N/A'}</TableCell>
			<TableCell>{survey.parentSurveyCode ?? 'N/A'}</TableCell>
			<TableCell>
				{survey.responses?.first_two_letters_fname ?? 'N/A'}
			</TableCell>
			<TableCell>
				{survey.responses?.first_two_letters_lname ?? 'N/A'}
			</TableCell>
			<TableCell>{survey.responses?.date_of_birth ?? 'N/A'}</TableCell>
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
					<Button
						size="small"
						variant="outlined"
						onClick={() =>
							navigate(`/survey/${survey._id}/continue`)
						}
						sx={{ textTransform: 'none' }}
					>
						Continue
					</Button>
				)}
			</TableCell>
		</TableRow>
	);
}
