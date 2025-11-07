import { TextField, TextFieldProps } from '@mui/material';

import { PermissionTooltip } from './PermissionTooltip';

interface FormInputProps extends Omit<TextFieldProps, 'variant'> {
	canEdit?: boolean;
	showTooltip?: boolean;
}

export const FormInput = ({
	canEdit = true,
	showTooltip = false,
	...props
}: FormInputProps) => {

	const input = (
		<TextField
			{...props}
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
