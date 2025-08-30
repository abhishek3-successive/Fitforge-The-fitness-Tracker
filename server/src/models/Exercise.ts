import mongoose, { Schema, Document } from 'mongoose';

// Define the Exercise interface
export interface IExercise extends Document {
  name: string;
  description: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'plyometric' | 'powerlifting' | 'olympic' | 'rehabilitation';
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  videoUrl?: string;
  imageUrls: string[];
  tips: string[];
  variations?: string[];
  isPublic: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Exercise schema
const ExerciseSchema: Schema = new Schema({
  name: {
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
  category: {
    type: String,
    required: true,
    enum: ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'powerlifting', 'olympic', 'rehabilitation'],
    index: true,
  },
  muscleGroups: [{
    type: String,
    required: true,
    enum: [
      'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
      'abs', 'obliques', 'lower-back',
      'quadriceps', 'hamstrings', 'glutes', 'calves',
      'full-body', 'core'
    ]
  }],
  equipment: [{
    type: String,
    required: true,
    enum: [
      'none', 'barbell', 'dumbbell', 'kettlebell', 'resistance-band',
      'pull-up-bar', 'bench', 'cable-machine', 'smith-machine',
      'treadmill', 'stationary-bike', 'elliptical', 'rowing-machine',
      'medicine-ball', 'foam-roller', 'yoga-mat', 'suspension-trainer'
    ]
  }],
  difficulty: {
    type: String,
    required: true,
    enum: ['beginner', 'intermediate', 'advanced'],
    index: true,
  },
  instructions: [{
    type: String,
    required: true,
  }],
  videoUrl: {
    type: String,
    trim: true,
  },
  imageUrls: [{
    type: String,
    trim: true,
  }],
  tips: [{
    type: String,
    trim: true,
  }],
  variations: [{
    type: String,
    trim: true,
  }],
  isPublic: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
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
ExerciseSchema.index({ category: 1, difficulty: 1 });
// ExerciseSchema.index({ muscleGroups: 1, equipment: 1 }); // Cannot index parallel arrays
ExerciseSchema.index({ muscleGroups: 1 }); // Separate index for muscle groups
ExerciseSchema.index({ equipment: 1 }); // Separate index for equipment
ExerciseSchema.index({ name: 'text', description: 'text' });

// Pre-save hook to update the `updatedAt` field
ExerciseSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Export the Exercise model
const Exercise = mongoose.model<IExercise>('Exercise', ExerciseSchema);

export default Exercise;
