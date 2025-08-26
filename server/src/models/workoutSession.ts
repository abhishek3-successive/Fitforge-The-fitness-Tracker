import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for workout session components
export interface ISessionExercise {
  exercise: mongoose.Types.ObjectId;
  plannedSets: number;
  completedSets: {
    setNumber: number;
    reps?: number;
    weight?: number;
    duration?: number; // in seconds
    completed: boolean;
    restDuration?: number; // actual rest taken in seconds
  }[];
  notes?: string;
  personalRecord?: boolean;
}

// Define the WorkoutSession interface
export interface IWorkoutSession extends Document {
  user: mongoose.Types.ObjectId;
  workoutPlan?: mongoose.Types.ObjectId;
  workoutPlanDay?: string; // which day of the workout plan
  title: string;
  exercises: ISessionExercise[];
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  status: 'planned' | 'in-progress' | 'completed' | 'skipped';
  caloriesBurned?: number;
  notes?: string;
  rating?: number; // user's rating of the workout (1-5)
  mood?: 'terrible' | 'bad' | 'okay' | 'good' | 'excellent';
  energy?: 'very-low' | 'low' | 'moderate' | 'high' | 'very-high';
  location?: string;
  weather?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the SessionExercise schema
const SessionExerciseSchema = new Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  },
  plannedSets: {
    type: Number,
    required: true,
    min: 1,
  },
  completedSets: [{
    setNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    reps: {
      type: Number,
      min: 0,
    },
    weight: {
      type: Number, // in kg
      min: 0,
    },
    duration: {
      type: Number, // in seconds
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    restDuration: {
      type: Number, // in seconds
      min: 0,
    },
  }],
  notes: {
    type: String,
    trim: true,
  },
  personalRecord: {
    type: Boolean,
    default: false,
  },
});

// Define the WorkoutSession schema
const WorkoutSessionSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  workoutPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlan',
    index: true,
  },
  workoutPlanDay: {
    type: String,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  exercises: [SessionExerciseSchema],
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in minutes
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['planned', 'in-progress', 'completed', 'skipped'],
    default: 'planned',
    index: true,
  },
  caloriesBurned: {
    type: Number,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  mood: {
    type: String,
    enum: ['terrible', 'bad', 'okay', 'good', 'excellent'],
  },
  energy: {
    type: String,
    enum: ['very-low', 'low', 'moderate', 'high', 'very-high'],
  },
  location: {
    type: String,
    trim: true,
  },
  weather: {
    type: String,
    trim: true,
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
WorkoutSessionSchema.index({ user: 1, startTime: -1 });
WorkoutSessionSchema.index({ user: 1, status: 1 });
WorkoutSessionSchema.index({ workoutPlan: 1, user: 1 });

// Pre-save hook to calculate duration and update `updatedAt`
WorkoutSessionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  
  // Calculate duration if endTime exists
  if (this.endTime && this.startTime) {
    const endTime = this.endTime as Date;
    const startTime = this.startTime as Date;
    this.duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  }
  
  next();
});

// Export the WorkoutSession model
const WorkoutSession = mongoose.model<IWorkoutSession>('WorkoutSession', WorkoutSessionSchema);

export default WorkoutSession;
