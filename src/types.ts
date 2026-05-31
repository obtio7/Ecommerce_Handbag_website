// ============ Product Types ============

export interface ProductVariant {
  _id: string;
  color: { name: string; hexCode: string };
  price: number;
  compareAtPrice?: number; // original price (strikethrough)
  discount?: {
    percentage: number;
    label?: string;
    startDate?: string;
    endDate?: string;
  };
  images: string[];
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  variants: ProductVariant[];
  tags?: string[];
  material?: string;
  dimensions?: string;
  featured: boolean;
  isActive?: boolean;
  // Backward-compat computed fields (set by mapApiProduct)
  imageUrl: string;
  price: number;
  stock: number;
  colors?: { name: string; hexCode: string }[];
  images?: string[];
}

/** Maps an API product (with variants) to the frontend Product interface */
export function mapApiProduct(apiProduct: any): Product {
  const variants: ProductVariant[] = (apiProduct.variants || []).map((v: any) => ({
    ...v,
    _id: v._id?.toString?.() || v._id || '',
  }));
  const firstVariant = variants[0];

  // Compute total stock across all variants
  const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

  // Get first image from first variant, or fallback
  const imageUrl = firstVariant?.images?.[0] || apiProduct.imageUrl || apiProduct.images?.[0] || '';

  // Get all colors from variants
  const colors = variants.map((v: any) => v.color).filter(Boolean);

  // Get all images from all variants
  const allImages = variants.flatMap((v: any) => v.images || []);

  return {
    id: apiProduct._id || apiProduct.id,
    _id: apiProduct._id,
    name: apiProduct.name,
    description: apiProduct.description,
    basePrice: apiProduct.basePrice || apiProduct.price || firstVariant?.price || 0,
    category: apiProduct.category,
    variants,
    tags: apiProduct.tags || [],
    material: apiProduct.material,
    dimensions: apiProduct.dimensions,
    featured: apiProduct.featured || false,
    isActive: apiProduct.isActive,
    // Backward compat
    imageUrl,
    price: apiProduct.basePrice || apiProduct.price || firstVariant?.price || 0,
    stock: totalStock,
    colors,
    images: allImages.length > 0 ? allImages : apiProduct.images || [],
  };
}

// ============ Cart Types ============

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  color: string;
  price: number; // actual price (after discount)
  originalPrice: number;
  quantity: number;
  imageUrl: string;
  sku: string;
  stock: number; // available stock for this variant
}

// ============ Order Types ============

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  color: string;
  originalPrice: number;
  price: number;
  quantity: number;
  imageUrl: string;
  sku: string;
}

export interface Order {
  id: string;
  _id?: string;
  orderNumber: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state?: string;
    zipCode: string;
    phone?: string;
  };
  statusHistory?: Array<{ status: string; changedAt: string; note?: string }>;
  paymentId?: string;
  createdAt: string;
}

// ============ User Types ============

export interface UserAddress {
  _id?: string;
  label: string;
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  isDefault: boolean;
}

// ============ Review Types ============

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface WishlistItem {
  productId: string;
  addedAt: any;
}
