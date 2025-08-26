import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for challenge components
export interface IChallengeParticipant {
  user: mongoose.Types.ObjectId;
  joinedAt: Date;
  progress: number; // percentage or count based on challenge type
  lastUpdate: Date;
  isCompleted: boolean;
  rank?: number;
}

export interface IChallengeReward {
  type: 'badge' | 'points' | 'achievement' | 'discount';
  name: string;
  description: string;
  imageUrl?: string;
  value?: number; // for points or discount percentage
}

// Define the Challenge interface
export interface IChallenge extends Document {
  title: string;
  description: string;
  type: 'workout-count' | 'distance' | 'duration' | 'weight-loss' | 'strength-goal' | 'consistency' | 'custom';
  category: 'individual' | 'team' | 'community';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  goal: {
    target: number; // target value (e.g., 30 workouts, 100km, 10kg loss)
    unit: string; // 'workouts', 'km', 'kg', 'minutes', 'days', etc.
    timeframe: 'daily' | 'weekly' | 'monthly' | 'custom';
  };
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  entryFee?: number; // in points or currency
  rewards: IChallengeReward[];
  rules: string[];
  imageUrl?: string;
  isPublic: boolean;
  requiresApproval: boolean;
  createdBy: mongoose.Types.ObjectId;
  participants: IChallengeParticipant[];
  totalParticipants: number;
  completedParticipants: number;
  status: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  tags: string[];
  leaderboard: {
    user: mongoose.Types.ObjectId;
    score: number;
    rank: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the ChallengeParticipant schema
const ChallengeParticipantSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastUpdate: {
    type: Date,
    default: Date.now,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  rank: {
    type: Number,
    min: 1,
  },
});

// Define the ChallengeReward schema
const ChallengeRewardSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['badge', 'points', 'achievement', 'discount'],
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  value: {
    type: Number,
    min: 0,
  },
});

// Define the Challenge schema
const ChallengeSchema: Schema = new Schema({
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
  type: {
    type: String,
    required: true,
    enum: ['workout-count', 'distance', 'duration', 'weight-loss', 'strength-goal', 'consistency', 'custom'],
    index: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['individual', 'team', 'community'],
    index: true,
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard', 'extreme'],
    index: true,
  },
  goal: {
    target: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    timeframe: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
    },
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
    index: true,
  },
  maxParticipants: {
    type: Number,
    min: 1,
  },
  entryFee: {
    type: Number,
    min: 0,
  },
  rewards: [ChallengeRewardSchema],
  rules: [{
    type: String,
    trim: true,
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
  requiresApproval: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  participants: [ChallengeParticipantSchema],
  totalParticipants: {
    type: Number,
    default: 0,
    min: 0,
  },
  completedParticipants: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'],
    default: 'draft',
    index: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  leaderboard: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    rank: {
      type: Number,
      required: true,
      min: 1,
    },
  }],
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
ChallengeSchema.index({ status: 1, startDate: 1 });
ChallengeSchema.index({ category: 1, difficulty: 1 });
ChallengeSchema.index({ type: 1, isPublic: 1 });
ChallengeSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Pre-save hook to update counters and `updatedAt`
ChallengeSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  
  // Update participant counters
  const participants = this.participants as IChallengeParticipant[];
  this.totalParticipants = participants.length;
  this.completedParticipants = participants.filter(p => p.isCompleted).length;
  
  next();
});

// Export the Challenge model
const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);

export default Challenge;
