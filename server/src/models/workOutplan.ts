import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for workout plan components
export interface IWorkoutExercise {
  exercise: mongoose.Types.ObjectId;
  sets: number;
  reps?: number;
  duration?: number; // in seconds for time-based exercises
  weight?: number; // in kg
  restBetweenSets?: number; // in seconds
  notes?: string;
}

export interface IWorkoutDay {
  dayName: string;
  exercises: IWorkoutExercise[];
  estimatedDuration?: number; // in minutes
}

// Define the WorkoutPlan interface
export interface IWorkoutPlan extends Document {
  title: string;
  description: string;
  goal: 'weight-loss' | 'muscle-gain' | 'strength' | 'endurance' | 'flexibility' | 'general-fitness';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // total weeks
  daysPerWeek: number;
  workoutDays: IWorkoutDay[];
  equipment: string[];
  targetAudience: string[];
  imageUrl?: string;
  isPublic: boolean;
  rating: number;
  totalRatings: number;
  createdBy: mongoose.Types.ObjectId;
  tags: string[];
  estimatedCaloriesBurn?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Define the WorkoutExercise schema
const WorkoutExerciseSchema = new Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  },
  sets: {
    type: Number,
    required: true,
    min: 1,
  },
  reps: {
    type: Number,
    min: 1,
  },
  duration: {
    type: Number, // in seconds
    min: 1,
  },
  weight: {
    type: Number, // in kg
    min: 0,
  },
  restBetweenSets: {
    type: Number, // in seconds
    default: 60,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
});

// Define the WorkoutDay schema
const WorkoutDaySchema = new Schema({
  dayName: {
    type: String,
    required: true,
    trim: true,
  },
  exercises: [WorkoutExerciseSchema],
  estimatedDuration: {
    type: Number, // in minutes
    min: 1,
  },
});

// Define the WorkoutPlan schema
const WorkoutPlanSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  goal: {
    type: String,
    required: true,
    enum: ['weight-loss', 'muscle-gain', 'strength', 'endurance', 'flexibility', 'general-fitness'],
    index: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true,
  },
  duration: {
    type: Number, // total weeks
    required: true,
    min: 1,
  },
  daysPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7,
  },
  workoutDays: [WorkoutDaySchema],
  equipment: [{
    type: String,
    enum: [
      'none', 'barbell', 'dumbbell', 'kettlebell', 'resistance-band',
      'pull-up-bar', 'bench', 'cable-machine', 'smith-machine',
      'treadmill', 'stationary-bike', 'elliptical', 'rowing-machine',
      'medicine-ball', 'foam-roller', 'yoga-mat', 'suspension-trainer'
    ]
  }],
  targetAudience: [{
    type: String,
    enum: ['men', 'women', 'seniors', 'teens', 'athletes', 'beginners', 'all']
  }],
  imageUrl: {
    type: String,
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  estimatedCaloriesBurn: {
    type: Number,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound indexes for better query performance
WorkoutPlanSchema.index({ goal: 1, difficulty: 1 });
WorkoutPlanSchema.index({ equipment: 1, difficulty: 1 });
WorkoutPlanSchema.index({ rating: -1, totalRatings: -1 });
WorkoutPlanSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Pre-save hook to update the `updatedAt` field
WorkoutPlanSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Export the WorkoutPlan model
const WorkoutPlan = mongoose.model<IWorkoutPlan>('WorkoutPlan', WorkoutPlanSchema);

export default WorkoutPlan;
