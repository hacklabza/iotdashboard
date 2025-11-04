export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthToken {
  token: string;
}

export interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}
