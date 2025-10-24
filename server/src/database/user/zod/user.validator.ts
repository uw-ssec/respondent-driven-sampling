import { baseUserSchema } from './user.base';

export const createUserSchema = baseUserSchema
	.pick({
		firstName: true,
		lastName: true,
		email: true,
		phone: true,
		role: true,
		locationObjectId: true
	})
	.strict();

// Can update all fields except locationObjectId
export const updateUserSchema = baseUserSchema
	.partial()
	.omit({ locationObjectId: true })
	.strict();
