import React, { useState } from 'react';

import { TextField, TextFieldProps } from '@mui/material';

import { PermissionTooltip } from './PermissionTooltip';

interface FormInputProps extends Omit<TextFieldProps, 'variant'> {
	canEdit?: boolean;
	showTooltip?: boolean;
}

export const FormInput = ({
	canEdit = true,
	showTooltip = false,
	required,
	value,
	error,
	helperText,
	onBlur,
	...props
}: FormInputProps) => {
	const [touched, setTouched] = useState(false);

	const handleBlur = (
		e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setTouched(true);
		onBlur?.(e);
	};

	// Show error if required and value is empty, but only after field has been touched
	const hasError =
		error ||
		(touched &&
			required &&
			(!value || (typeof value === 'string' && !value.trim())));

	const input = (
		<TextField
			{...props}
			required={required}
			value={value}
			error={hasError}
			onBlur={handleBlur}
			helperText={
				hasError &&
				touched &&
				required &&
				(!value || (typeof value === 'string' && !value.trim()))
					? 'This field is required'
					: helperText
			}
			disabled={!canEdit}
			variant="outlined"
			fullWidth
			sx={{
				'& .MuiOutlinedInput-root': {
					backgroundColor: !canEdit ? '#f5f5f5' : 'white'
				}
			}}
		/>
	);

	if (showTooltip && !canEdit) {
		return (
			<PermissionTooltip canEdit={canEdit}>
				<span style={{ width: '100%' }}>{input}</span>
			</PermissionTooltip>
		);
	}

	return input;
};
