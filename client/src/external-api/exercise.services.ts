import { apiClient, handleApiError, handleApiResponse } from './client';
import { Exercise, PaginatedResponse } from '@/lib/types';

export interface ExerciseFilters {
  category?: 'strength' | 'cardio' | 'flexibility' | 'balance';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  muscleGroup?: string;
  equipment?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateExerciseData {
  name: string;
  description: string;
  instructions: string[];
  muscleGroups: string[];
  equipment: string[];
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'plyometric' | 'powerlifting' | 'olympic' | 'rehabilitation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  videoUrl?: string;
  imageUrls?: string[];
  tips?: string[];
  variations?: string[];
  isPublic: boolean;
}

export class ExerciseService {
  /**
   * Get all exercises with optional filters
   */
  static async getExercises(filters?: ExerciseFilters): Promise<PaginatedResponse<Exercise>> {
    try {
      const response = await apiClient.get('/exercises', { params: filters });
      console.log('🔧 Raw API Response:', response.data);
      
      const apiResponse = handleApiResponse(response);
      console.log('🔧 Processed API Response:', apiResponse);
      
      // Handle the backend response structure: { success: true, data: [...], pagination: {...} }
      if (apiResponse && typeof apiResponse === 'object') {
        // Check if it's the expected backend format
        if ('success' in apiResponse && 'data' in apiResponse) {
          const backendResponse = apiResponse as any;
          return {
            data: backendResponse.data || [],
            pagination: backendResponse.pagination || {
              current: 1,
              total: 1,
              count: (backendResponse.data || []).length,
              totalCount: (backendResponse.data || []).length,
            }
          };
        }
        
        // If it's already in the expected format
        if ('data' in apiResponse && Array.isArray((apiResponse as any).data)) {
          return apiResponse as PaginatedResponse<Exercise>;
        }
        
        // If the response is directly an array (unlikely but handle it)
        if (Array.isArray(apiResponse)) {
          return {
            data: apiResponse as Exercise[],
            pagination: {
              current: 1,
              total: 1,
              count: (apiResponse as Exercise[]).length,
              totalCount: (apiResponse as Exercise[]).length,
            }
          };
        }
      }
      
      // Fallback: return empty result
      console.warn('🔧 Unexpected API response structure:', apiResponse);
      return {
        data: [],
        pagination: {
          current: 1,
          total: 0,
          count: 0,
          totalCount: 0,
        }
      };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get exercise by ID
   */
  static async getExerciseById(id: string): Promise<Exercise> {
    try {
      const response = await apiClient.get(`/exercises/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create new exercise
   */
  static async createExercise(data: CreateExerciseData): Promise<Exercise> {
    try {
      const response = await apiClient.post('/exercises', data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update exercise
   */
  static async updateExercise(id: string, data: Partial<CreateExerciseData>): Promise<Exercise> {
    try {
      const response = await apiClient.put(`/exercises/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete exercise
   */
  static async deleteExercise(id: string): Promise<void> {
    try {
      await apiClient.delete(`/exercises/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get exercise categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const response = await apiClient.get('/exercises/categories');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get muscle groups
   */
  static async getMuscleGroups(): Promise<string[]> {
    try {
      const response = await apiClient.get('/exercises/muscle-groups');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get equipment types
   */
  static async getEquipmentTypes(): Promise<string[]> {
    try {
      const response = await apiClient.get('/exercises/equipment');
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search exercises by name or description
   */
  static async searchExercises(query: string, limit = 10): Promise<Exercise[]> {
    try {
      const response = await apiClient.get('/exercises/search', { 
        params: { q: query, limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get popular exercises
   */
  static async getPopularExercises(limit = 10): Promise<Exercise[]> {
    try {
      const response = await apiClient.get('/exercises/popular', { 
        params: { limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get recommended exercises based on user preferences
   */
  static async getRecommendedExercises(limit = 10): Promise<Exercise[]> {
    try {
      const response = await apiClient.get('/exercises/recommended', { 
        params: { limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
