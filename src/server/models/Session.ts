import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  token: string;
  adminId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

const SessionSchema = new Schema<ISession>({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index for automatic session cleanup
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model<ISession>('Session', SessionSchema);

export default Session;
