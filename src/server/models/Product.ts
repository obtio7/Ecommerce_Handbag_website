import mongoose, { Schema, Document } from 'mongoose';

// Each variant represents a specific color of the handbag
export interface IVariant {
  _id?: mongoose.Types.ObjectId;
  color: { name: string; hexCode: string };
  price: number;
  compareAtPrice?: number; // original price before discount (shown as strikethrough)
  discount?: {
    percentage: number; // e.g., 20 means 20% off
    label?: string; // e.g., "Summer Sale", "New Arrival Offer"
    startDate?: Date;
    endDate?: Date;
  };
  images: string[]; // image URLs specific to this color variant
  stock: number;
  sku: string; // unique identifier like "ZRV-TOTE-BLK-001"
}

export interface IProduct extends Document {
  name: string;
  description: string;
  basePrice: number; // lowest price across variants (for display/sorting)
  category: string;
  variants: IVariant[];
  tags: string[]; // "new arrival", "bestseller", "limited edition"
  material?: string;
  dimensions?: string; // e.g., "30cm x 25cm x 12cm"
  featured: boolean;
  isActive: boolean; // soft delete / hide from storefront
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema({
  color: {
    name: { type: String, required: true, maxlength: 50 },
    hexCode: { type: String, required: true, match: /^#[0-9A-Fa-f]{6}$/ },
  },
  price: { type: Number, required: true, min: 0.01, max: 999999.99 },
  compareAtPrice: { type: Number, min: 0.01, max: 999999.99 },
  discount: {
    percentage: { type: Number, min: 1, max: 99 },
    label: { type: String, maxlength: 50 },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  images: {
    type: [{ type: String }],
    validate: {
      validator: (val: string[]) => val.length <= 10,
      message: 'Each variant can have max 10 images',
    },
  },
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, required: true, maxlength: 50 },
}, { _id: true });

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 2000 },
    basePrice: { type: Number, required: true, min: 0.01, max: 999999.99 },
    category: { type: String, required: true, maxlength: 50 },
    variants: {
      type: [VariantSchema],
      validate: {
        validator: (val: IVariant[]) => val.length >= 1 && val.length <= 20,
        message: 'Product must have between 1 and 20 variants',
      },
    },
    tags: { type: [{ type: String, maxlength: 30 }], default: [] },
    material: { type: String, maxlength: 200 },
    dimensions: { type: String, maxlength: 100 },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ 'variants.sku': 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
