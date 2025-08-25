import mongoose, { Schema, Document } from 'mongoose';

// Define the User interface
export interface IUser extends Document {
  username: string;
  email: string;
  password?: string; // Optional for now, will be hashed
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update the `updatedAt` field
UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Export the User model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
