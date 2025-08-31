import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'challenge_created' | 'challenge_joined' | 'challenge_completed' | 'challenge_reminder';
  title: string;
  message: string;
  userId: mongoose.Types.ObjectId; // recipient
  relatedId?: mongoose.Types.ObjectId; // related challenge/user/etc
  relatedModel?: 'Challenge' | 'User' | 'WorkoutSession';
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string; // where to navigate when clicked
  priority: 'low' | 'medium' | 'high';
  data?: any; // additional metadata
}

const NotificationSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ['challenge_created', 'challenge_joined', 'challenge_completed', 'challenge_reminder'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['Challenge', 'User', 'WorkoutSession']
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },
  actionUrl: {
    type: String
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for performance
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

// Auto-delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model<INotification>('Notification', NotificationSchema);