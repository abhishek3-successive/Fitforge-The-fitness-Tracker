import mongoose, { Schema, Document } from 'mongoose';

// Define the ProgressPhoto interface
export interface IProgressPhoto extends Document {
  user: mongoose.Types.ObjectId;
  imageUrl: string;
  thumbnailUrl?: string;
  category: 'front' | 'back' | 'side' | 'face' | 'specific-muscle' | 'transformation' | 'other';
  bodyPart?: 'full-body' | 'upper-body' | 'lower-body' | 'arms' | 'chest' | 'back' | 'legs' | 'abs' | 'face';
  description?: string;
  weight?: number; // in kg at the time of photo
  bodyFatPercentage?: number;
  measurements?: {
    chest?: number; // in cm
    waist?: number;
    hips?: number;
    biceps?: number;
    thighs?: number;
    neck?: number;
  };
  isPublic: boolean;
  tags: string[];
  likes: number;
  comments: number;
  dateTaken: Date;
  milestone?: string; // e.g., "6 months transformation", "First day", etc.
  createdAt: Date;
  updatedAt: Date;
}

// Define the ProgressPhoto schema
const ProgressPhotoSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['front', 'back', 'side', 'face', 'specific-muscle', 'transformation', 'other'],
    index: true,
  },
  bodyPart: {
    type: String,
    enum: ['full-body', 'upper-body', 'lower-body', 'arms', 'chest', 'back', 'legs', 'abs', 'face'],
    index: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  weight: {
    type: Number, // in kg
    min: 0,
    max: 500,
  },
  bodyFatPercentage: {
    type: Number,
    min: 0,
    max: 100,
  },
  measurements: {
    chest: {
      type: Number, // in cm
      min: 0,
    },
    waist: {
      type: Number, // in cm
      min: 0,
    },
    hips: {
      type: Number, // in cm
      min: 0,
    },
    biceps: {
      type: Number, // in cm
      min: 0,
    },
    thighs: {
      type: Number, // in cm
      min: 0,
    },
    neck: {
      type: Number, // in cm
      min: 0,
    },
  },
  isPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
  comments: {
    type: Number,
    default: 0,
    min: 0,
  },
  dateTaken: {
    type: Date,
    required: true,
    index: true,
  },
  milestone: {
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
ProgressPhotoSchema.index({ user: 1, dateTaken: -1 });
ProgressPhotoSchema.index({ user: 1, category: 1 });
ProgressPhotoSchema.index({ isPublic: 1, likes: -1 });
ProgressPhotoSchema.index({ tags: 1, isPublic: 1 });

// Pre-save hook to update the `updatedAt` field
ProgressPhotoSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Export the ProgressPhoto model
const ProgressPhoto = mongoose.model<IProgressPhoto>('ProgressPhoto', ProgressPhotoSchema);

export default ProgressPhoto;
