// External API Services
export { AuthService } from './auth.service';
export { ExerciseService } from './exercise.services';
export { WorkoutPlanService } from './workout-plan.service';
export { WorkoutSessionService } from './workout-session.service';
export { ProgressPhotoService } from './progress-photo.service';
export { ChallengeService } from './challenges.service';
export { UserService } from './user.service';

// API Client utilities
export { apiClient, graphqlClient, handleApiError, handleApiResponse } from './client';

// Re-export types for convenience
export type {
  ExerciseFilters,
  CreateExerciseData,
} from './exercise.services';

export type { WorkoutPlanFilters, CreateWorkoutPlanData } from './workout-plan.service';
export type { 
  WorkoutSessionFilters, 
  CreateWorkoutSessionData, 
  UpdateWorkoutSessionData 
} from './workout-session.service';
export type { ProgressPhotoFilters, CreateProgressPhotoData } from './progress-photo.service';
export type { ChallengeFilters, CreateChallengeData } from './challenges.service';
export type { 
  UserFilters, 
  UpdateUserData, 
  UserStats, 
  Activity, 
  UserPreferences 
} from './user.service';
