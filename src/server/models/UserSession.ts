import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSession extends Document {
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// TTL index for automatic cleanup of expired sessions
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UserSession = mongoose.model<IUserSession>('UserSession', UserSessionSchema);
export default UserSession;
