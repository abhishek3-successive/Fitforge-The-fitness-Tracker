import { apiClient, handleApiError, handleApiResponse } from './client';
import { WorkoutPlan, WorkoutPlanExercise, PaginatedResponse, Rating } from '@/lib/types';

export interface WorkoutPlanFilters {
  goal?: string; // changed from category to match backend
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // max duration in weeks (not minutes)
  userId?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  category?: string; // for backward compatibility
}

export interface CreateWorkoutPlanData {
  title: string; // changed from name to match backend
  description: string;
  workoutDays: any[]; // backend structure
  duration: number; // in weeks
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goal: string; // changed from category
  tags: string[];
  isPublic: boolean;
  equipment?: string[];
  targetAudience?: string[];
  daysPerWeek?: number;
}

// Transform backend data to frontend format
const transformWorkoutPlan = (backendPlan: any): WorkoutPlan => {
  console.log('🔄 Transforming backend plan:', backendPlan);
  
  // Flatten exercises from all workout days
  const exercises: WorkoutPlanExercise[] = [];
  if (backendPlan.workoutDays) {
    backendPlan.workoutDays.forEach((day: any) => {
      if (day.exercises) {
        day.exercises.forEach((exercise: any) => {
          exercises.push({
            ...exercise,
            restTime: exercise.restBetweenSets || 60, // add compatibility field
          });
        });
      }
    });
  }

  const transformed = {
    ...backendPlan,
    name: backendPlan.title, // add compatibility field
    category: backendPlan.goal, // add compatibility field
    averageRating: backendPlan.rating || 0, // add compatibility field
    ratings: [], // add compatibility field (would need separate API call to populate)
    exercises, // flattened exercises for compatibility
  };
  
  console.log('✅ Transformed plan:', {
    id: transformed._id,
    name: transformed.name,
    title: transformed.title,
    exercises: transformed.exercises?.length || 0
  });
  
  return transformed;
};

// Transform paginated response
const transformPaginatedWorkoutPlans = (response: any): PaginatedResponse<WorkoutPlan> => {
  console.log('🔄 Transforming paginated response:', response);
  
  const transformed = {
    data: response.data?.map(transformWorkoutPlan) || [],
    pagination: response.pagination,
    // Add backward compatibility fields
    total: response.pagination?.totalCount,
    page: response.pagination?.current,
    pages: response.pagination?.total,
    limit: response.pagination?.count,
  };
  
  console.log('✅ Transformed paginated response:', {
    dataLength: transformed.data.length,
    pagination: transformed.pagination
  });
  
  return transformed;
};

export class WorkoutPlanService {
  /**
   * Get user's workout plans with retry mechanism
   */
  static async getUserWorkoutPlans(userId?: string, page = 1, limit = 10): Promise<PaginatedResponse<WorkoutPlan>> {
    if (!userId) {
      console.warn('⚠️ getUserWorkoutPlans called without userId, returning empty result');
      return {
        data: [],
        pagination: { current: 1, total: 0, count: 0, totalCount: 0 },
        total: 0,
        page: 1,
        pages: 0,
        limit
      };
    }
    
    let lastError: any;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting to fetch user workout plans (attempt ${attempt}/${maxRetries}) for user: ${userId}`);
        
        // Use the correct backend endpoint format - always requires userId
        const endpoint = `/workout-plans/user/${userId}`;
        console.log(`📡 Making request to: ${endpoint}`);
        
        const response = await apiClient.get(endpoint, { 
          params: { page, limit },
          timeout: attempt === 1 ? 30000 : 60000 // Increase timeout on retries
        });
        
        console.log(`📨 Raw response from ${endpoint}:`, response.data);
        
        // Handle the backend response structure directly
        const backendResponse = response.data;
        if (backendResponse.success && backendResponse.data) {
          const transformedPlans = backendResponse.data.map(transformWorkoutPlan);
          const result = {
            data: transformedPlans,
            pagination: backendResponse.pagination || { current: 1, total: 1, count: transformedPlans.length, totalCount: transformedPlans.length },
            total: backendResponse.pagination?.totalCount || transformedPlans.length,
            page: backendResponse.pagination?.current || 1,
            pages: backendResponse.pagination?.total || 1,
            limit: backendResponse.pagination?.count || limit,
          };
          
          console.log(`✅ Successfully fetched user workout plans on attempt ${attempt}:`, result);
          return result;
        } else {
          throw new Error('Invalid response structure from backend');
        }
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error?.message || error);
        
        // Don't retry on client errors (4xx) or auth errors
        if (error?.response?.status && error.response.status < 500) {
          console.error(`🚫 Not retrying due to client error (${error.response.status})`);
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(handleApiError(lastError));
  }

  /**
   * Get all workout plans with optional filters
   */
  static async getWorkoutPlans(filters?: WorkoutPlanFilters): Promise<PaginatedResponse<WorkoutPlan>> {
    try {
      console.log('🔄 Fetching workout plans with filters:', filters);
      
      // Transform frontend filters to backend format
      const backendFilters: any = { ...filters };
      if (filters?.category && !filters.goal) {
        backendFilters.goal = filters.category;
        delete backendFilters.category;
      }

      const response = await apiClient.get('/workout-plans', { 
        params: backendFilters,
        timeout: 45000 // Slightly longer timeout for filtered requests
      });
      
      console.log('📨 Raw workout plans response:', response.data);
      
      // Handle the backend response structure directly  
      const backendResponse = response.data;
      if (backendResponse.success && backendResponse.data) {
        const transformedPlans = backendResponse.data.map(transformWorkoutPlan);
        const result = {
          data: transformedPlans,
          pagination: backendResponse.pagination || { current: 1, total: 1, count: transformedPlans.length, totalCount: transformedPlans.length },
          total: backendResponse.pagination?.totalCount || transformedPlans.length,
          page: backendResponse.pagination?.current || 1,
          pages: backendResponse.pagination?.total || 1,
          limit: backendResponse.pagination?.count || (filters?.limit || 10),
        };
        
        console.log('✅ Successfully fetched workout plans:', result);
        return result;
      } else {
        throw new Error('Invalid response structure from backend');
      }
    } catch (error) {
      console.error('❌ Failed to fetch workout plans:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get workout plan by ID
   */
  static async getWorkoutPlanById(id: string): Promise<WorkoutPlan> {
    try {
      const response = await apiClient.get(`/workout-plans/${id}`);
      const rawData = handleApiResponse(response);
      return transformWorkoutPlan(rawData);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create new workout plan
   */
  static async createWorkoutPlan(data: CreateWorkoutPlanData): Promise<WorkoutPlan> {
    try {
      const response = await apiClient.post('/workout-plans', data);
      const rawData = handleApiResponse(response);
      return transformWorkoutPlan(rawData);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update workout plan
   */
  static async updateWorkoutPlan(id: string, data: Partial<CreateWorkoutPlanData>): Promise<WorkoutPlan> {
    try {
      const response = await apiClient.put(`/workout-plans/${id}`, data);
      const rawData = handleApiResponse(response);
      return transformWorkoutPlan(rawData);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete workout plan
   */
  static async deleteWorkoutPlan(id: string): Promise<void> {
    try {
      await apiClient.delete(`/workout-plans/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Rate a workout plan
   */
  static async rateWorkoutPlan(id: string, rating: number, comment?: string): Promise<void> {
    try {
      await apiClient.post(`/workout-plans/${id}/rate`, { rating, comment });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get ratings for a workout plan
   */
  static async getWorkoutPlanRatings(id: string): Promise<Rating[]> {
    try {
      const response = await apiClient.get(`/workout-plans/${id}/ratings`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Clone/duplicate a workout plan
   */
  static async cloneWorkoutPlan(id: string): Promise<WorkoutPlan> {
    try {
      const response = await apiClient.post(`/workout-plans/${id}/clone`);
      const rawData = handleApiResponse(response);
      return transformWorkoutPlan(rawData);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get popular workout plans
   */
  static async getPopularWorkoutPlans(limit = 10): Promise<WorkoutPlan[]> {
    try {
      const response = await apiClient.get('/workout-plans', { 
        params: { limit, sortBy: 'rating' } 
      });
      const rawData: any = handleApiResponse(response);
      return (rawData.data || []).map(transformWorkoutPlan);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get recommended workout plans
   */
  static async getRecommendedWorkoutPlans(limit = 10): Promise<WorkoutPlan[]> {
    try {
      const response = await apiClient.get('/workout-plans', { 
        params: { limit, sortBy: 'newest' } 
      });
      const rawData: any = handleApiResponse(response);
      return (rawData.data || []).map(transformWorkoutPlan);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get workout plan categories (return goals as categories)
   */
  static async getCategories(): Promise<string[]> {
    try {
      // Return the available goal types from the backend model
      return ['weight-loss', 'muscle-gain', 'strength', 'endurance', 'flexibility', 'general-fitness'];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Search workout plans
   */
  static async searchWorkoutPlans(query: string, limit = 10): Promise<WorkoutPlan[]> {
    try {
      const response = await apiClient.get('/workout-plans', { 
        params: { search: query, limit } 
      });
      const rawData: any = handleApiResponse(response);
      return (rawData.data || []).map(transformWorkoutPlan);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
