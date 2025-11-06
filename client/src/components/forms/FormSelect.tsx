import {
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	SelectProps
} from '@mui/material';

import { PermissionTooltip } from './PermissionTooltip';

interface FormSelectProps extends Omit<SelectProps, 'variant'> {
	label: string;
	options: Array<{ value: string; label: string }>;
	canEdit?: boolean;
	showTooltip?: boolean;
	helperText?: string;
	error?: boolean;
}

export const FormSelect = ({
	label,
	options,
	canEdit = true,
	showTooltip = false,
	helperText,
	error,
	disabled,
	...props
}: FormSelectProps) => {
	const isDisabled = disabled || !canEdit;
	const labelId = `${props.name || 'select'}-label`;

	const selectControl = (
		<FormControl fullWidth error={error} disabled={isDisabled}>
			<InputLabel id={labelId}>{label}</InputLabel>
			<Select
				{...props}
				labelId={labelId}
				label={label}
				variant="outlined"
				disabled={isDisabled}
				sx={{
					backgroundColor: isDisabled ? '#f5f5f5' : 'white'
				}}
			>
				{options.map(option => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
			{helperText && <FormHelperText>{helperText}</FormHelperText>}
		</FormControl>
	);

	if (showTooltip && !canEdit) {
		return (
			<PermissionTooltip canEdit={canEdit}>
				<span style={{ width: '100%' }}>{selectControl}</span>
			</PermissionTooltip>
		);
	}

	return selectControl;
};
