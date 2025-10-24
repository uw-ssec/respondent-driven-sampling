import { Schema } from 'mongoose';

import { userExistsValidationHook } from '@/database/utils/hooks';

export const injectUserHooks = (schema: Schema) => {
	schema.pre(
		'save',
		userExistsValidationHook('approval.approvedByUserObjectId')
	);
};
