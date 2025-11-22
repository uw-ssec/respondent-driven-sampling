import React from 'react';

import { Tooltip } from '@mui/material';

export const PermissionTooltip = ({
	children,
	canEdit
}: {
	children: React.ReactElement;
	canEdit: boolean;
}) => (
	<Tooltip
		title="You do not have permission to edit this field"
		disableHoverListener={canEdit}
		disableFocusListener={canEdit}
		disableTouchListener={canEdit}
		arrow
	>
		<span>{children}</span>
	</Tooltip>
);
