// Type definitions for FitForge API
export interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  bio?: string;
  stats?: UserStats;
}

export interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  totalExercises: number;
  averageWorkoutDuration: number;
}

export interface Exercise {
  _id: string;
  name: string;
  description: string;
  instructions: string[];
  muscleGroups?: string[];
  equipment?: string[] | string; // Can be array or string
  category: 'strength' | 'cardio' | 'flexibility' | 'balance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  imageUrls?: string[]; // API returns imageUrls (array)
  tips?: string[]; // API returns tips array
  variations?: string[]; // API returns variations array
  createdBy: string | { _id: string; username: string }; // API returns populated object
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutPlan {
  _id: string;
  title: string;
  name: string; // computed property for backward compatibility
  description: string;
  goal: 'weight-loss' | 'muscle-gain' | 'strength' | 'endurance' | 'flexibility' | 'general-fitness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in weeks
  daysPerWeek: number;
  workoutDays: WorkoutDay[];
  exercises: WorkoutPlanExercise[]; // flattened for compatibility
  equipment: string[];
  targetAudience: string[];
  imageUrl?: string;
  isPublic: boolean;
  rating: number;
  totalRatings: number;
  averageRating: number; // computed from rating
  createdBy: User;
  tags: string[];
  estimatedCaloriesBurn?: number;
  category: string; // computed from goal for compatibility
  ratings: Rating[]; // computed for compatibility
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutDay {
  _id?: string;
  dayName: string;
  exercises: WorkoutPlanExercise[];
  estimatedDuration?: number; // in minutes
}

export interface WorkoutPlanExercise {
  _id?: string;
  exercise: Exercise;
  sets: number;
  reps?: number;
  duration?: number; // in seconds for time-based exercises
  weight?: number; // in kg
  restBetweenSets?: number; // in seconds
  restTime: number; // alias for restBetweenSets for compatibility
  notes?: string;
}

export interface WorkoutSession {
  _id: string;
  userId: string;
  workoutPlan?: WorkoutPlan;
  exercises: WorkoutSessionExercise[];
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  notes?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSessionExercise {
  exercise: Exercise;
  sets?: WorkoutSet[]; // frontend structure
  completedSets?: WorkoutSet[]; // backend structure  
  plannedSets?: number; // backend field
  notes?: string;
  completed?: boolean;
  personalRecord?: boolean;
}

export interface WorkoutSet {
  setNumber?: number; // backend field
  reps?: number;
  weight?: number;
  duration?: number;
  completed?: boolean;
  restTime?: number; // frontend field
  restDuration?: number; // backend field
}

export interface ProgressPhoto {
  _id: string;
  user: string; // backend uses 'user' instead of 'userId'
  imageUrl: string;
  thumbnailUrl?: string;
  category: 'front' | 'back' | 'side' | 'face' | 'specific-muscle' | 'transformation' | 'other';
  bodyPart?: 'full-body' | 'upper-body' | 'lower-body' | 'arms' | 'chest' | 'back' | 'legs' | 'abs' | 'face';
  description?: string;
  weight?: number;
  bodyFatPercentage?: number;
  measurements?: Measurements;
  isPublic: boolean;
  tags: string[];
  likes?: number;
  comments?: number;
  dateTaken: string;
  milestone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Measurements {
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  neck?: number;
}

export interface Challenge {
  _id: string;
  title: string;
  name?: string; // for backward compatibility
  description: string;
  type: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'medium';
  startDate: string;
  endDate: string;
  maxParticipants: number;
  entryFee: number;
  rewards: ChallengeReward[];
  rules: string[];
  imageUrl?: string;
  isPublic: boolean;
  requiresApproval: boolean;
  participants: ChallengeParticipant[];
  leaderboard: LeaderboardEntry[];
  totalParticipants: number;
  completedParticipants: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  tags: string[];
  goal: {
    target: number;
    unit: string;
    timeframe: string;
  };
  createdBy: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeReward {
  _id?: string;
  type: 'badge' | 'points' | 'prize';
  name: string;
  description: string;
  value?: number;
  imageUrl?: string;
}

export interface ChallengeParticipant {
  _id?: string;
  user: User;
  joinedAt: string;
  progress: number;
  status: 'active' | 'completed' | 'dropped';
}

export interface LeaderboardEntry {
  user: User;
  score: number;
  rank: number;
  progress: number; // percentage
}

export interface Rating {
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    current: number;
    total: number;
    count: number;
    totalCount: number;
  };
  total?: number; // for backward compatibility
  page?: number; // for backward compatibility
  pages?: number; // for backward compatibility
  limit?: number; // for backward compatibility
}

// Chat & Real-time types
export interface ChatMessage {
  _id: string;
  senderId: string;
  recipientId: string;
  message: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: string;
  read: boolean;
  edited: boolean;
  editedAt?: string;
}

export interface ChatRoom {
  _id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  createdAt: string;
  updatedAt: string;
}

// Form validation schemas
export interface FormErrors {
  [key: string]: string | undefined;
}

// API Status
export interface ApiStatus {
  loading: boolean;
  error: string | null;
  success: boolean;
}
