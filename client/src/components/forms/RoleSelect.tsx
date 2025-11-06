import { SelectProps } from '@mui/material';

import { FormSelect } from './FormSelect';

interface RoleSelectProps extends Omit<SelectProps, 'variant'> {
	canEdit?: boolean;
	showTooltip?: boolean;
	includeEmptyOption?: boolean;
}

const ROLE_OPTIONS = [
	{ value: 'VOLUNTEER', label: 'Volunteer' },
	{ value: 'MANAGER', label: 'Manager' },
	{ value: 'ADMIN', label: 'Admin' }
];

export const RoleSelect = ({
	canEdit = true,
	showTooltip = false,
	includeEmptyOption = true,
	...props
}: RoleSelectProps) => {
	const options = includeEmptyOption
		? [{ value: '', label: 'Select a role' }, ...ROLE_OPTIONS]
		: ROLE_OPTIONS;

	return (
		<FormSelect
			{...props}
			label="Role"
			options={options}
			canEdit={canEdit}
			showTooltip={showTooltip}
		/>
	);
};
