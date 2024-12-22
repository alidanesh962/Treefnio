import mongoose from 'mongoose';

export interface IUser {
  _id: string;
  username: string;
  password: string;
  role: 'admin' | 'staff' | 'manager';
  name: string;
  active: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export type NewUser = Omit<IUser, '_id' | 'createdAt' | 'lastLogin'>;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'manager'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
});

export default mongoose.models.User || mongoose.model('User', userSchema); 