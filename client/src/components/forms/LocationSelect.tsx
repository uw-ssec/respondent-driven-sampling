import { useApi } from '@/hooks';
import { SelectProps } from '@mui/material';

import { FormSelect } from './FormSelect';

interface LocationSelectProps extends Omit<SelectProps, 'variant'> {
	canEdit?: boolean;
	showTooltip?: boolean;
	includeEmptyOption?: boolean;
}

export const LocationSelect = ({
	canEdit = true,
	showTooltip = false,
	includeEmptyOption = true,
	...props
}: LocationSelectProps) => {
	const { locationService } = useApi();
	const { data: locations = [] } = locationService.useLocations() ?? {};

	const options = locations?.map(
		(location: { _id: string; hubName: string }) => ({
			value: location._id,
			label: location.hubName
		})
	);

	const optionsWithEmpty = includeEmptyOption
		? [{ value: '', label: 'Select a location' }, ...(options ?? [])]
		: options;

	return (
		<FormSelect
			{...props}
			label="Location"
			options={optionsWithEmpty ?? []}
			canEdit={canEdit}
			showTooltip={showTooltip}
		/>
	);
};
