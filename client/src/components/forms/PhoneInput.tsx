import { TextField, TextFieldProps } from '@mui/material';

import { PermissionTooltip } from './PermissionTooltip';

interface PhoneInputProps extends Omit<TextFieldProps, 'variant' | 'type'> {
	canEdit?: boolean;
	showTooltip?: boolean;
}

export const PhoneInput = ({
	canEdit = true,
	showTooltip = false,
	disabled,
	value,
	onChange,
	...props
}: PhoneInputProps) => {
	const isDisabled = disabled || !canEdit;

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!onChange) return;

		let input = e.target.value.replace(/\D/g, '');

		// Remove leading 1 if present
		if (input.length > 0 && input[0] === '1') {
			input = input.substring(1);
		}

		// Limit to 10 digits
		input = input.slice(0, 10);

		// Format with +1 prefix
		const formatted = input.length > 0 ? `+1${input}` : '';

		// Create a synthetic event with the formatted value
		const syntheticEvent = {
			...e,
			target: { ...e.target, value: formatted }
		};

		onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
	};

	const input = (
		<TextField
			{...props}
			type="tel"
			value={value || ''}
			onChange={handlePhoneChange}
			disabled={isDisabled}
			variant="outlined"
			fullWidth
			placeholder="+1XXXXXXXXXX"
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
