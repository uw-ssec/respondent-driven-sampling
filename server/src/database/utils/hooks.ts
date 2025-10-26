import Location from '../location/mongoose/location.model';
import User from '../user/mongoose/user.model';
import { errors } from './errors';

// Hooks shared across several models; wrapped to allow for custom field names for validation

export const locationExistsValidationHook = (
	fieldName: string = 'locationObjectId'
) => {
	return async function (this: any, next: any) {
		if (!(fieldName in this)) {
			next(errors.INVALID_FIELD_NAME);
		}
		const location = await Location.findById(this[fieldName]);
		if (!location) {
			next(errors.OBJECT_ID_NOT_FOUND);
		}
		next();
	};
};

export const userExistsValidationHook = (
	fieldName: string = 'userObjectId'
) => {
	return async function (this: any, next: any) {
		if (!(fieldName in this)) {
			next(errors.INVALID_FIELD_NAME);
		}

		const user = await User.findById(this[fieldName]);
		if (!user) {
			next(errors.OBJECT_ID_NOT_FOUND);
		}

		next();
	};
};
