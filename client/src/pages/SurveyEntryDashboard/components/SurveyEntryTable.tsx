import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel
} from '@mui/material';

import { SurveyDocument } from '@/types/Survey';

import SurveyEntryDashboardRow from './SurveyEntryDashboardRow';

interface Column {
	key: string;
	label: string;
	sortable: boolean;
	width: number;
}

interface SurveyEntryTableProps {
	surveys: SurveyDocument[];
	isLoading: boolean;
	columns: Column[];
	sortConfig: {
		key: string | null;
		direction: 'asc' | 'desc';
	};
	onSort: (key: string) => void;
}

export default function SurveyEntryTable({
	surveys,
	isLoading,
	columns,
	sortConfig,
	onSort
}: SurveyEntryTableProps) {
	return (
		<TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
			<Table stickyHeader>
				<TableHead>
					<TableRow>
						{columns.map(column => (
							<TableCell
								key={column.key}
								sx={{
									fontWeight: 600,
									backgroundColor: '#f9f9f9',
									minWidth: column.width
								}}
							>
								{column.sortable ? (
									<TableSortLabel
										active={sortConfig.key === column.key}
										direction={
											sortConfig.key === column.key
												? sortConfig.direction
												: 'asc'
										}
										onClick={() => onSort(column.key)}
									>
										{column.label}
									</TableSortLabel>
								) : (
									column.label
								)}
							</TableCell>
						))}
					</TableRow>
				</TableHead>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={columns.length} align="center">
								Loading surveys...
							</TableCell>
						</TableRow>
					) : surveys.length === 0 ? (
						<TableRow>
							<TableCell colSpan={columns.length} align="center">
								No surveys found.
							</TableCell>
						</TableRow>
					) : (
						surveys.map((survey, index) => (
							<SurveyEntryDashboardRow
								key={index}
								survey={survey}
							/>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
