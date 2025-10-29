import Seed from '../mongoose/seed.model';
import { baseSeedSchema } from './seed.base';

export const createSeedSchema = baseSeedSchema
	.pick({
		locationObjectId: true,
		isFallback: true // This marks `isFallback` as acceptable in the request body
	})
	.partial({
		isFallback: true // This marks `isFallback` as optional
	})
	.strict()
	.meta({ model: Seed });

// No update needed for Seed model -- immutable once created
