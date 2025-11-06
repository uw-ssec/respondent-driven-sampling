import { ReactNode } from 'react';

import { Header } from '@/components';
import { useAuthContext } from '@/contexts';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
	children: ReactNode;
	redirectTo?: string;
}

export const ProtectedRoute = ({
	children,
	redirectTo = '/login'
}: ProtectedRouteProps) => {
	const { isLoggedIn } = useAuthContext();
	return isLoggedIn ? (
		<>
			<Header />
			{children}
		</>
	) : (
		<Navigate replace to={redirectTo} />
	);
};
