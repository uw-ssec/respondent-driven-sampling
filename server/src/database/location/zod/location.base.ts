import { z } from 'zod';

import { HubType, LocationType } from '@/database/utils/constants';

export const baseLocationSchema = z.object({
	hubName: z.string().trim().min(1, 'Hub name cannot be empty'),
	hubType: z.enum(HubType),
	locationType: z.enum(LocationType),
	address: z.string().trim().min(1, 'Address cannot be empty')
});
