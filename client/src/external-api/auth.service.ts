import { apiClient, handleApiError, handleApiResponse } from './client';
import { User, AuthTokens, LoginCredentials, RegisterData } from '@/lib/types';

export class AuthService {
  /**
   * User login
   */
  static async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiClient.post('/users/login', credentials);
      const data = handleApiResponse(response) as any;
      
      // Transform backend response to match frontend expectations
      return {
        user: data.user,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * User registration
   */
  static async register(userData: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiClient.post('/users/register', userData);
      const data = handleApiResponse(response) as any;
      
      // Transform backend response to match frontend expectations
      return {
        user: data.user,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken
        }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post('/users/refresh-token', { refreshToken });
      const data = handleApiResponse(response) as any;
      
      // Transform backend response to match frontend expectations
      return {
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken || refreshToken // Use new refresh token if provided, otherwise keep current
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get('/users/me');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Logout user (server-side cleanup)
   */
  static async logout(): Promise<void> {
    try {
      await apiClient.post('/users/logout');
    } catch (error) {
      // Even if server logout fails, we should clear local storage
      console.warn('Server logout failed:', handleApiError(error));
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/users/forgot-password', { email });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/users/reset-password', { token, password: newPassword });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/users/change-password', { 
        currentPassword, 
        newPassword 
      });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Verify email address
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post('/users/verify-email', { token });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(): Promise<void> {
    try {
      await apiClient.post('/users/resend-verification');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
