import { ISeed } from '@/database/seed/mongoose/seed.model';

export interface SeedDocument extends ISeed {
	_id: string;
}