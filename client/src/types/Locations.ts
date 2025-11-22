import { ILocation } from '@/database/location/mongoose/location.model';

export interface LocationDocument extends ILocation {
	_id: string;
}
