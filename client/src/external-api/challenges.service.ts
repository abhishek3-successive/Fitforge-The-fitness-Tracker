import { apiClient, handleApiError, handleApiResponse } from './client';
import { Challenge, LeaderboardEntry, PaginatedResponse, User } from '@/lib/types';

export interface ChallengeFilters {
  category?: string;
  status?: 'active' | 'upcoming' | 'completed';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  userId?: string;
  isParticipant?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateChallengeData {
  name: string;
  description: string;
  rules: string[];
  startDate: string;
  endDate: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prize?: string;
  isActive: boolean;
}

export class ChallengeService {
  /**
   * Get all challenges with optional filters
   */
  static async getChallenges(filters?: ChallengeFilters): Promise<PaginatedResponse<Challenge>> {
    try {
      const response = await apiClient.get('/challenges', { params: filters });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get challenge by ID
   */
  static async getChallengeById(id: string): Promise<Challenge> {
    try {
      const response = await apiClient.get(`/challenges/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create new challenge
   */
  static async createChallenge(data: CreateChallengeData): Promise<Challenge> {
    try {
      const response = await apiClient.post('/challenges', data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update challenge
   */
  static async updateChallenge(id: string, data: Partial<CreateChallengeData>): Promise<Challenge> {
    try {
      const response = await apiClient.put(`/challenges/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete challenge
   */
  static async deleteChallenge(id: string): Promise<void> {
    try {
      await apiClient.delete(`/challenges/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Join a challenge
   */
  static async joinChallenge(id: string): Promise<Challenge> {
    try {
      const response = await apiClient.post(`/challenges/${id}/join`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Leave a challenge
   */
  static async leaveChallenge(id: string): Promise<Challenge> {
    try {
      const response = await apiClient.post(`/challenges/${id}/leave`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get challenge leaderboard
   */
  static async getChallengeLeaderboard(id: string): Promise<LeaderboardEntry[]> {
    try {
      const response = await apiClient.get(`/challenges/${id}/leaderboard`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update challenge progress
   */
  static async updateChallengeProgress(id: string, progress: number): Promise<void> {
    try {
      await apiClient.post(`/challenges/${id}/progress`, { progress });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user's challenges
   */
  static async getUserChallenges(userId?: string, status?: string): Promise<Challenge[]> {
    try {
      const response = await apiClient.get('/challenges/user', { 
        params: { userId, status } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get active challenges
   */
  static async getActiveChallenges(limit = 10): Promise<Challenge[]> {
    try {
      const response = await apiClient.get('/challenges/active', { 
        params: { limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get upcoming challenges
   */
  static async getUpcomingChallenges(limit = 10): Promise<Challenge[]> {
    try {
      const response = await apiClient.get('/challenges/upcoming', { 
        params: { limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get popular challenges
   */
  static async getPopularChallenges(limit = 10): Promise<Challenge[]> {
    try {
      const response = await apiClient.get('/challenges/popular', { 
        params: { limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get challenge categories
   */
  static async getChallengeCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get('/challenges/categories');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search challenges
   */
  static async searchChallenges(query: string, limit = 10): Promise<Challenge[]> {
    try {
      const response = await apiClient.get('/challenges/search', { 
        params: { q: query, limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get challenge participants
   */
  static async getChallengeParticipants(id: string): Promise<User[]> {
    try {
      const response = await apiClient.get(`/challenges/${id}/participants`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
