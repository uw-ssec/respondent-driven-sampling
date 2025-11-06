import { TextField, TextFieldProps } from '@mui/material';

import { PermissionTooltip } from './PermissionTooltip';

interface FormInputProps extends Omit<TextFieldProps, 'variant'> {
	canEdit?: boolean;
	showTooltip?: boolean;
}

export const FormInput = ({
	canEdit = true,
	showTooltip = false,
	disabled,
	...props
}: FormInputProps) => {
	const isDisabled = disabled || !canEdit;

	const input = (
		<TextField
			{...props}
			disabled={isDisabled}
			variant="outlined"
			fullWidth
			sx={{
				'& .MuiOutlinedInput-root': {
					backgroundColor: isDisabled ? '#f5f5f5' : 'white'
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
