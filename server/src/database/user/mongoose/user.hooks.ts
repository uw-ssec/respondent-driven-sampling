import { Schema } from 'mongoose';

import User from '@/database/user/mongoose/user.model';
import { ApprovalStatus } from '@/database/utils/constants';
import { errors } from '@/database/utils/errors';

const approverValidationHook = async function (this: any, next: any) {
	// If this is a pending user and approvedByUserObjectId is null, that's okay
	if (
		this.approvalStatus === ApprovalStatus.PENDING &&
		this.approvedByUserObjectId === null
	) {
		next(); // Allow null for pending users
	} else {
		const user = await User.findById(this.approvedByUserObjectId);
		if (!user) {
			next(errors.OBJECT_ID_NOT_FOUND);
		}
		next();
	}
};

export const injectUserHooks = (schema: Schema) => {
	schema.pre('save', approverValidationHook);
};
