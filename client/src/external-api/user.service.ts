import { apiClient, handleApiError, handleApiResponse } from './client';
import { User, PaginatedResponse } from '@/lib/types';

export interface UserFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
}

export interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  totalExercises: number;
  averageWorkoutDuration: number;
  totalChallenges: number;
  challengesWon: number;
  progressPhotos: number;
  accountAge: number; // days
}

export class UserService {
  /**
   * Get all users with optional filters
   */
  static async getUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    try {
      const response = await apiClient.get('/users', { params: filters });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<User> {
    try {
      const response = await apiClient.get(`/users/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(id: string, data: UpdateUserData): Promise<User> {
    try {
      const response = await apiClient.put(`/users/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Upload user avatar
   */
  static async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId?: string): Promise<UserStats> {
    try {
      const response = await apiClient.get('/users/stats', { 
        params: { userId } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user activity feed
   */
  static async getUserActivity(userId?: string, limit = 20): Promise<Activity[]> {
    try {
      const response = await apiClient.get('/users/activity', { 
        params: { userId, limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user followers
   */
  static async getUserFollowers(userId: string, limit = 50): Promise<User[]> {
    try {
      const response = await apiClient.get(`/users/${userId}/followers`, { 
        params: { limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user following
   */
  static async getUserFollowing(userId: string, limit = 50): Promise<User[]> {
    try {
      const response = await apiClient.get(`/users/${userId}/following`, { 
        params: { limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Follow a user
   */
  static async followUser(userId: string): Promise<void> {
    try {
      await apiClient.post(`/users/${userId}/follow`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(userId: string): Promise<void> {
    try {
      await apiClient.post(`/users/${userId}/unfollow`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search users
   */
  static async searchUsers(query: string, limit = 10): Promise<User[]> {
    try {
      const response = await apiClient.get('/users/search', { 
        params: { q: query, limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(userId?: string): Promise<UserPreferences> {
    try {
      const response = await apiClient.get('/users/preferences', { 
        params: { userId } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await apiClient.put('/users/preferences', preferences);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// Additional types for user service
export interface Activity {
  _id: string;
  userId: string;
  type: 'workout' | 'challenge' | 'progress_photo' | 'achievement';
  title: string;
  description: string;
  data: Record<string, any>;
  createdAt: string;
}

export interface UserPreferences {
  notifications: {
    workoutReminders: boolean;
    challengeUpdates: boolean;
    socialUpdates: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    workoutVisibility: 'public' | 'friends' | 'private';
    progressVisibility: 'public' | 'friends' | 'private';
  };
  units: {
    weight: 'kg' | 'lbs';
    distance: 'km' | 'miles';
    height: 'cm' | 'ft';
  };
  theme: 'light' | 'dark' | 'system';
}
