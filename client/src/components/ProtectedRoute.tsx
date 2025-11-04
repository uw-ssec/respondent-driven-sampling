import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { Header } from '@/components';

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
  return isLoggedIn ? <><Header />{children}</> : <Navigate replace to={redirectTo} />;
};
