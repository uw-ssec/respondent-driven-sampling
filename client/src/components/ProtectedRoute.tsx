import { ReactNode } from 'react';

import { Header } from '@/components';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
	isLoggedIn: boolean;
	children: ReactNode;
	redirectTo?: string;
}

export const ProtectedRoute = ({
	isLoggedIn,
	children,
	redirectTo = '/login'
}: ProtectedRouteProps) => {
	return isLoggedIn ? (
		<>
			<Header />
			{children}
		</>
	) : (
		<Navigate replace to={redirectTo} />
	);
};
