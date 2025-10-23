import { HubType, LocationType } from '@database/utils/constants';
import mongoose, { InferSchemaType, Model, Schema } from 'mongoose';

const locationSchema = new Schema({
	hubName: { type: String, required: true, unique: true },
	hubType: { type: String, enum: HubType, required: true },
	locationType: { type: String, enum: LocationType, required: true },
	address: { type: String, required: true, unique: true }
});

export type ILocation = InferSchemaType<typeof locationSchema>;
const Location: Model<ILocation> = mongoose.model<ILocation>(
	'Location',
	locationSchema
);
export default Location;
