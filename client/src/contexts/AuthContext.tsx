import { createContext, useContext, ReactNode } from 'react';

interface AuthContextValue {
  onLogout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ 
  children, 
  value 
}: { 
  children: ReactNode; 
  value: AuthContextValue 
}) => {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};