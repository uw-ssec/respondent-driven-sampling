export interface LoginProps {
  onLogin: (token: string) => Promise<void>;
}

export interface LogoutProps {
  onLogout: () => void;
}
