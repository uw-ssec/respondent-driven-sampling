import { useState } from 'react';

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
	required,
	value,
	onBlur,
	...props
}: FormSelectProps) => {
	const labelId = `${props.name ?? 'select'}-label`;
	const [touched, setTouched] = useState(false);

	const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
		setTouched(true);
		onBlur?.(e);
	};

	// Show error if required and value is empty, but only after field has been touched
	const hasError = error || (touched && required && !value);

	const selectControl = (
		<FormControl
			fullWidth
			error={hasError}
			required={required}
			disabled={!canEdit}
		>
			<InputLabel id={labelId}>{label}</InputLabel>
			<Select
				{...props}
				labelId={labelId}
				label={label}
				variant="outlined"
				disabled={!canEdit}
				required={required}
				value={value}
				onBlur={handleBlur}
				sx={{
					backgroundColor: !canEdit ? '#f5f5f5' : 'white'
				}}
			>
				{options.map(option => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
			{hasError && touched && required && !value && (
				<FormHelperText>This field is required</FormHelperText>
			)}
			{helperText && !hasError && (
				<FormHelperText>{helperText}</FormHelperText>
			)}
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
