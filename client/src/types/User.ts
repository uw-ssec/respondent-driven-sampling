import { IUser } from '@/database/user/mongoose/user.model';

export interface UserDocument extends IUser {
	_id: string;
}
