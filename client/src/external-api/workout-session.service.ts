import { apiClient, handleApiError, handleApiResponse } from './client';
import { WorkoutSession, WorkoutSessionExercise, PaginatedResponse } from '@/lib/types';

export interface WorkoutSessionFilters {
  userId?: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
  workoutPlanId?: string;
  page?: number;
  limit?: number;
}

export interface CreateWorkoutSessionData {
  userId: string;
  workoutPlanId?: string;
  title?: string; // Added for backend compatibility
  exercises: WorkoutSessionExercise[];
  notes?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  startTime?: string; // Added for backend compatibility
}

export interface UpdateWorkoutSessionData {
  exercises?: WorkoutSessionExercise[];
  endTime?: string;
  duration?: number;
  notes?: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'cancelled';
}

export class WorkoutSessionService {
  /**
   * Get all workout sessions with optional filters
   */
  static async getWorkoutSessions(filters?: WorkoutSessionFilters): Promise<PaginatedResponse<WorkoutSession>> {
    try {
      const response = await apiClient.get('/workout-sessions', { params: filters });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get workout session by ID
   */
  static async getWorkoutSessionById(id: string): Promise<WorkoutSession> {
    try {
      const response = await apiClient.get(`/workout-sessions/${id}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create new workout session
   */
  static async createWorkoutSession(data: CreateWorkoutSessionData): Promise<WorkoutSession> {
    try {
      // Transform frontend data to backend structure
      // Note: user field is now set automatically by the backend from req.user._id
      const backendData = {
        workoutPlan: data.workoutPlanId, // Backend expects 'workoutPlan'
        title: data.title || `Workout Session ${new Date().toLocaleDateString()}`, // Backend requires 'title'
        exercises: data.exercises,
        notes: data.notes,
        status: data.status,
        startTime: data.startTime || new Date().toISOString(),
      };

      console.log('🔄 Sending to backend (user will be set from auth):', backendData);
      
      const response = await apiClient.post('/workout-sessions', backendData);
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ WorkoutSession creation error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Update workout session
   */
  static async updateWorkoutSession(id: string, data: UpdateWorkoutSessionData): Promise<WorkoutSession> {
    try {
      const response = await apiClient.put(`/workout-sessions/${id}`, data);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete workout session
   */
  static async deleteWorkoutSession(id: string): Promise<void> {
    try {
      await apiClient.delete(`/workout-sessions/${id}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Start a workout session
   */
  static async startWorkoutSession(id: string): Promise<WorkoutSession> {
    try {
      const response = await apiClient.patch(`/workout-sessions/${id}/start`);
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ Start workout session error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Complete a workout session
   */
  static async completeWorkoutSession(id: string, data?: {
    duration?: number;
    caloriesBurned?: number;
    rating?: number;
    mood?: string;
    energy?: string;
    notes?: string;
  }): Promise<WorkoutSession> {
    try {
      const response = await apiClient.patch(`/workout-sessions/${id}/complete`, {
        endTime: new Date().toISOString(),
        ...data,
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ Complete workout session error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Cancel a workout session (using update method)
   */
  static async cancelWorkoutSession(id: string): Promise<WorkoutSession> {
    try {
      const response = await apiClient.put(`/workout-sessions/${id}`, {
        status: 'cancelled',
        endTime: new Date().toISOString(),
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('❌ Cancel workout session error:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get user's workout sessions
   */
  static async getUserWorkoutSessions(userId?: string, limit = 10): Promise<PaginatedResponse<WorkoutSession>> {
    try {
      const response = await apiClient.get('/workout-sessions', { 
        params: { userId, limit } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get active workout session for user
   */
  static async getActiveWorkoutSession(userId?: string): Promise<WorkoutSession | null> {
    try {
      const response = await apiClient.get('/workout-sessions/active', { 
        params: { userId } 
      });
      return handleApiResponse(response);
    } catch (error) {
      // Return null if no active session found
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as any).response?.status === 404
      ) {
        return null;
      }
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get workout session statistics
   */
  static async getWorkoutStats(userId?: string, period = 'month'): Promise<{
    totalWorkouts: number;
    totalDuration: number;
    averageDuration: number;
    workoutsByCategory: Record<string, number>;
    workoutsByDay: Record<string, number>;
  }> {
    try {
      const response = await apiClient.get('/workout-sessions/stats', { 
        params: { userId, period } 
      });
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create workout session from workout plan
   */
  static async createSessionFromPlan(workoutPlanId: string): Promise<WorkoutSession> {
    try {
      const response = await apiClient.post(`/workout-sessions/from-plan/${workoutPlanId}`);
      return handleApiResponse(response);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}
