import { LoginCredentials, AuthToken } from '@/types/auth';

// Use the same base URL as deviceService
const API_BASE_URL = 'http://192.168.68.101:8000';

export const authService = {
  /**
   * Login with username and password
   * @param credentials Username and password
   * @returns Promise with auth token
   */
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Login failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Auth service error:', error);
      throw error;
    }
  },
};
