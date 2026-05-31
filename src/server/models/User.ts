import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
  label: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

export interface IUser extends Document {
  userId: string;
  email: string;
  name: string;
  passwordHash?: string;
  photoURL?: string;
  phone?: string;
  addresses: IAddress[];
  orderCount: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  label: { type: String, default: 'Home' },
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: '' },
  zipCode: { type: String, required: true },
  phone: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    name: { type: String, required: true },
    passwordHash: { type: String },
    photoURL: { type: String, default: '' },
    phone: { type: String },
    addresses: { type: [AddressSchema], default: [] },
    orderCount: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', UserSchema);
