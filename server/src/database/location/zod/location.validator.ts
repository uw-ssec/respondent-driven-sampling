import { baseLocationSchema } from './location.base';

export const createLocationSchema = baseLocationSchema
	.pick({
		hubName: true,
		hubType: true,
		locationType: true,
		address: true
	})
	.strict();

export const updateLocationSchema = baseLocationSchema.partial().strict();
