import Seed from '../mongoose/seed.model';
import { baseSeedSchema } from './seed.base';

export const createSeedSchema = baseSeedSchema
	.pick({
		locationObjectId: true,
		isFallback: true
	})
	.partial({
		isFallback: true // This marks `isFallback` as optional; defaults to false unless otherwise specified as declared in the base schema
	})
	.strict()
	.meta({ model: Seed });

// No update needed for Seed model -- immutable once created
