import mongoose, { InferSchemaType, Model, Schema } from 'mongoose';

import { injectSeedHooks } from './seed.hooks';

const seedSchema = new Schema(
	{
		surveyCode: {
			type: String,
			required: true,
			unique: true,
			immutable: true
		},
		locationObjectId: {
			type: Schema.Types.ObjectId,
			required: true,
			immutable: true
		},
		isFallback: { type: Boolean, default: false, immutable: true } // If true, was a fallback code generated in app after survey code validation failed
	},
	{
		timestamps: {
			createdAt: true,
			updatedAt: false // No updates allowed, don't need to track updates
		},
		indexes: [{ fields: 'surveyCode', unique: true }],
		strict: 'throw' // This will throw an error for immutable field update attempts
	}
);

injectSeedHooks(seedSchema);

export type ISeed = InferSchemaType<typeof seedSchema>;
const Seed: Model<ISeed> = mongoose.model<ISeed>('Seed', seedSchema);
export default Seed;
