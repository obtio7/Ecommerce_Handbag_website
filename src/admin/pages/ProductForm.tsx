import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// --- Types ---

interface VariantDiscount {
  percentage: string;
  label: string;
}

interface VariantFormData {
  colorName: string;
  colorHex: string;
  price: string;
  compareAtPrice: string;
  discount: VariantDiscount;
  stock: string;
  sku: string;
  images: string[]; // Store uploaded image URLs
  _id?: string; // For existing variants
}

interface ProductFormData {
  name: string;
  description: string;
  basePrice: string;
  category: string;
  material: string;
  dimensions: string;
  tags: string;
  featured: boolean;
  isActive: boolean;
  variants: VariantFormData[];
}

interface FieldErrors {
  [key: string]: string;
}

// --- Defaults ---

const createEmptyVariant = (): VariantFormData => ({
  colorName: '',
  colorHex: '#000000',
  price: '',
  compareAtPrice: '',
  discount: { percentage: '', label: '' }, // Empty means no discount
  stock: '0',
  sku: '',
  images: [],
});

const INITIAL_FORM: ProductFormData = {
  name: '',
  description: '',
  basePrice: '',
  category: '',
  material: '',
  dimensions: '',
  tags: '',
  featured: false,
  isActive: true,
  variants: [createEmptyVariant()],
};

// --- Image Upload Component per Variant (inline, works during create) ---

const VariantImageUpload: React.FC<{
  images: string[];
  onImagesChange: (images: string[]) => void;
  variantName: string;
}> = ({ images, onImagesChange, variantName }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('images', files[i]);
      }

      // Upload to a general endpoint that just returns Cloudinary URLs
      const res = await fetch('/api/admin/upload-images', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      const result = await res.json();
      onImagesChange([...images, ...result.urls]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    onImagesChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Move image up/down with buttons (alternative to drag)
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onImagesChange(newImages);
  };

  return (
    <div className="border border-dashed border-border-tan rounded-lg p-3 bg-white/30 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-dark/60">
          Images for {variantName || 'this variant'}
        </span>
        <span className="text-[10px] text-text-dark/40">{images.length}/10 · Drag to reorder</span>
      </div>

      {/* Show existing images with drag-to-reorder */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((url, idx) => (
            <div 
              key={idx} 
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`relative group w-16 h-16 rounded overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all ${
                draggedIndex === idx ? 'opacity-50 scale-95' : ''
              } ${
                dragOverIndex === idx && draggedIndex !== idx 
                  ? 'border-primary ring-2 ring-primary/30 scale-105' 
                  : 'border-border-tan'
              }`}
            >
              <img src={url} alt={`${variantName} ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />
              
              {/* Image number badge */}
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-black/60 rounded text-white text-[9px] flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              
              {/* Hover controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {/* Move buttons */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 'up')}
                    disabled={idx === 0}
                    className="w-5 h-5 bg-white/90 rounded flex items-center justify-center disabled:opacity-30"
                    title="Move left"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(idx, 'down')}
                    disabled={idx === images.length - 1}
                    className="w-5 h-5 bg-white/90 rounded flex items-center justify-center disabled:opacity-30"
                    title="Move right"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="w-5 h-5 bg-red-500 rounded flex items-center justify-center"
                  title="Remove image"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploadError && <p className="text-[10px] text-red-600 mb-2">{uploadError}</p>}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
          disabled={uploading || images.length >= 10}
        />
        {uploading && (
          <svg className="animate-spin h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>
    </div>
  );
};

// --- Component ---

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState<ProductFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // --- Fetch product for edit mode ---

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    setIsFetching(true);
    try {
      const res = await fetch('/api/admin/products?pageSize=1000', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      const product = data.data?.find((p: any) => p._id === id);
      if (!product) throw new Error('Product not found');

      setForm({
        name: product.name || '',
        description: product.description || '',
        basePrice: String(product.basePrice ?? ''),
        category: product.category || '',
        material: product.material || '',
        dimensions: product.dimensions || '',
        tags: (product.tags || []).join(', '),
        featured: product.featured ?? false,
        isActive: product.isActive ?? true,
        variants: (product.variants || []).map((v: any) => ({
          colorName: v.color?.name || '',
          colorHex: v.color?.hexCode || '#000000',
          price: String(v.price ?? ''),
          compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : '',
          discount: {
            percentage: v.discount?.percentage ? String(v.discount.percentage) : '',
            label: v.discount?.label || '',
          },
          stock: String(v.stock ?? 0),
          sku: v.sku || '',
          images: v.images || [],
          _id: v._id,
        })),
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to load product');
    } finally {
      setIsFetching(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [isEditMode, fetchProduct]);

  // --- Validation ---

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};

    if (!form.name.trim()) {
      errs.name = 'Name is required';
    } else if (form.name.trim().length > 100) {
      errs.name = 'Name must not exceed 100 characters';
    }

    if (!form.description.trim()) {
      errs.description = 'Description is required';
    } else if (form.description.trim().length > 2000) {
      errs.description = 'Description must not exceed 2000 characters';
    }

    const basePrice = Number(form.basePrice);
    if (!form.basePrice) {
      errs.basePrice = 'Base price is required';
    } else if (isNaN(basePrice) || basePrice < 0.01) {
      errs.basePrice = 'Base price must be a positive number';
    }

    if (!form.category.trim()) {
      errs.category = 'Category is required';
    } else if (form.category.trim().length > 50) {
      errs.category = 'Category must not exceed 50 characters';
    }

    if (form.variants.length === 0) {
      errs.variants = 'At least one variant is required';
    } else {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      const skus = new Set<string>();

      for (let i = 0; i < form.variants.length; i++) {
        const v = form.variants[i];

        if (!v.colorName.trim()) {
          errs[`variant_${i}_colorName`] = 'Color name is required';
        }
        if (!hexRegex.test(v.colorHex)) {
          errs[`variant_${i}_colorHex`] = 'Invalid hex code (use #RRGGBB)';
        }

        const price = Number(v.price);
        if (!v.price) {
          errs[`variant_${i}_price`] = 'Price is required';
        } else if (isNaN(price) || price < 0.01) {
          errs[`variant_${i}_price`] = 'Price must be a positive number';
        }

        if (v.compareAtPrice) {
          const cap = Number(v.compareAtPrice);
          if (isNaN(cap) || cap < 0.01) {
            errs[`variant_${i}_compareAtPrice`] = 'Must be a positive number';
          }
        }

        if (v.discount.percentage && v.discount.percentage !== '0') {
          const pct = Number(v.discount.percentage);
          if (isNaN(pct) || pct < 1 || pct > 99) {
            errs[`variant_${i}_discountPercentage`] = 'Must be between 1 and 99';
          }
        }

        const stock = Number(v.stock);
        if (v.stock === '') {
          errs[`variant_${i}_stock`] = 'Stock is required';
        } else if (isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
          errs[`variant_${i}_stock`] = 'Must be a non-negative integer';
        }

        if (!v.sku.trim()) {
          errs[`variant_${i}_sku`] = 'SKU is required';
        } else if (skus.has(v.sku.trim())) {
          errs[`variant_${i}_sku`] = 'Duplicate SKU within this product';
        }
        skus.add(v.sku.trim());
      }
    }

    return errs;
  };

  // --- Submit ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const tagsArray = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        basePrice: Number(form.basePrice),
        category: form.category.trim(),
        material: form.material.trim() || undefined,
        dimensions: form.dimensions.trim() || undefined,
        tags: tagsArray,
        featured: form.featured,
        isActive: form.isActive,
        variants: form.variants.map((v) => {
          const variant: any = {
            color: { name: v.colorName.trim(), hexCode: v.colorHex },
            price: Number(v.price),
            stock: Number(v.stock),
            sku: v.sku.trim(),
            images: v.images || [],
          };
          if (v._id) {
            variant._id = v._id;
          }
          if (v.compareAtPrice) {
            variant.compareAtPrice = Number(v.compareAtPrice);
          }
          if (v.discount.percentage && Number(v.discount.percentage) > 0) {
            variant.discount = {
              percentage: Number(v.discount.percentage),
              label: v.discount.label.trim() || undefined,
            };
          }
          return variant;
        }),
      };

      const url = isEditMode
        ? `/api/admin/products/${id}`
        : '/api/admin/products';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.fields) {
          setErrors(data.fields);
        } else {
          setSubmitError(data.error || 'Failed to save product');
        }
        return;
      }

      navigate('/admin/products');
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Variant helpers ---

  const addVariant = () => {
    if (form.variants.length >= 20) return;
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, createEmptyVariant()],
    }));
  };

  const removeVariant = (index: number) => {
    if (form.variants.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const updateVariant = (index: number, field: keyof VariantFormData, value: any) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const updateVariantDiscount = (index: number, field: keyof VariantDiscount, value: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, discount: { ...v.discount, [field]: value } } : v
      ),
    }));
  };

  const updateVariantImages = (index: number, images: string[]) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, images } : v
      ),
    }));
  };

  // --- Render ---

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-6 w-6 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="text-sm text-text-dark/60 hover:text-primary transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Products
        </button>
        <h1 className="text-2xl font-serif text-primary mt-2">
          {isEditMode ? 'Edit Product' : 'Add Product'}
        </h1>
      </div>

      {submitError && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ===== BASIC INFO SECTION ===== */}
        <section>
          <h2 className="text-lg font-medium text-text-dark mb-4">Basic Information</h2>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-dark/80 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                maxLength={100}
                className={`w-full px-4 py-2.5 border rounded-md bg-white text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                  errors.name ? 'border-red-400' : 'border-border-tan'
                }`}
                placeholder="Product name"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-text-dark/80 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                maxLength={2000}
                rows={4}
                className={`w-full px-4 py-2.5 border rounded-md bg-white text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y ${
                  errors.description ? 'border-red-400' : 'border-border-tan'
                }`}
                placeholder="Product description"
              />
              <div className="flex justify-between mt-1">
                {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
                <p className="text-xs text-text-dark/40 ml-auto">{form.description.length}/2000</p>
              </div>
            </div>

            {/* Base Price and Category row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="basePrice" className="block text-sm font-medium text-text-dark/80 mb-1.5">
                  Base Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.basePrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, basePrice: e.target.value }))}
                  className={`w-full px-4 py-2.5 border rounded-md bg-white text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    errors.basePrice ? 'border-red-400' : 'border-border-tan'
                  }`}
                  placeholder="2999"
                />
                {errors.basePrice && <p className="mt-1 text-xs text-red-600">{errors.basePrice}</p>}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-text-dark/80 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  className={`w-full px-4 py-2.5 border rounded-md bg-white text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                    errors.category ? 'border-red-400' : 'border-border-tan'
                  }`}
                >
                  <option value="">Select a category</option>
                  <option value="Tote">Tote</option>
                  <option value="Clutch">Clutch</option>
                  <option value="Sling">Sling</option>
                  <option value="Handbag">Handbag</option>
                  <option value="Shoulder Bag">Shoulder Bag</option>
                  <option value="Crossbody">Crossbody</option>
                  <option value="Backpack">Backpack</option>
                  <option value="Wallet">Wallet</option>
                  <option value="Carryalls">Carryalls</option>
                  <option value="Clutches">Clutches</option>
                  <option value="Best Sellers">Best Sellers</option>
                  <option value="New Arrivals">New Arrivals</option>
                  <option value="Limited Edition">Limited Edition</option>
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
              </div>
            </div>

            {/* Material and Dimensions row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="material" className="block text-sm font-medium text-text-dark/80 mb-1.5">
                  Material
                </label>
                <input
                  id="material"
                  type="text"
                  value={form.material}
                  onChange={(e) => setForm((prev) => ({ ...prev, material: e.target.value }))}
                  maxLength={200}
                  className="w-full px-4 py-2.5 border border-border-tan rounded-md bg-white text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="e.g. Italian Leather"
                />
              </div>

              <div>
                <label htmlFor="dimensions" className="block text-sm font-medium text-text-dark/80 mb-1.5">
                  Dimensions
                </label>
                <input
                  id="dimensions"
                  type="text"
                  value={form.dimensions}
                  onChange={(e) => setForm((prev) => ({ ...prev, dimensions: e.target.value }))}
                  maxLength={100}
                  className="w-full px-4 py-2.5 border border-border-tan rounded-md bg-white text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="e.g. 30x25x12cm"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-text-dark/80 mb-1.5">
                Tags <span className="text-xs text-text-dark/40">(comma-separated)</span>
              </label>
              <input
                id="tags"
                type="text"
                value={form.tags}
                onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                className="w-full px-4 py-2.5 border border-border-tan rounded-md bg-white text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="new arrival, bestseller, limited edition"
              />
              {errors.tags && <p className="mt-1 text-xs text-red-600">{errors.tags}</p>}
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <label htmlFor="featured" className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-border-tan rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <span className="text-sm text-text-dark/80">Featured</span>
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="isActive" className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-border-tan rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
                <span className="text-sm text-text-dark/80">Active (visible on storefront)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== VARIANTS SECTION ===== */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-text-dark">
              Variants <span className="text-sm font-normal text-text-dark/50">({form.variants.length}/20)</span>
            </h2>
            <button
              type="button"
              onClick={addVariant}
              disabled={form.variants.length >= 20}
              className="text-sm px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add Variant
            </button>
          </div>

          {errors.variants && (
            <p className="mb-3 text-xs text-red-600">{errors.variants}</p>
          )}

          <div className="space-y-4">
            {form.variants.map((variant, index) => (
              <div
                key={index}
                className="border border-border-tan rounded-lg p-4 bg-white/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-text-dark/70">
                    Variant {index + 1}
                    {variant.colorName && (
                      <span className="ml-2 text-text-dark/50">— {variant.colorName}</span>
                    )}
                  </h3>
                  {form.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Color row */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1">Color Name *</label>
                    <input
                      type="text"
                      value={variant.colorName}
                      onChange={(e) => updateVariant(index, 'colorName', e.target.value)}
                      maxLength={50}
                      className={`w-full px-3 py-2 border rounded-md bg-white text-sm text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                        errors[`variant_${index}_colorName`] ? 'border-red-400' : 'border-border-tan'
                      }`}
                      placeholder="e.g. Red"
                    />
                    {errors[`variant_${index}_colorName`] && (
                      <p className="mt-0.5 text-xs text-red-600">{errors[`variant_${index}_colorName`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1">Hex Code *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={variant.colorHex}
                        onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                        className="w-9 h-9 rounded border border-border-tan cursor-pointer"
                      />
                      <input
                        type="text"
                        value={variant.colorHex}
                        onChange={(e) => updateVariant(index, 'colorHex', e.target.value)}
                        maxLength={7}
                        className={`w-24 px-2 py-2 border rounded-md bg-white text-sm text-text-dark font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                          errors[`variant_${index}_colorHex`] ? 'border-red-400' : 'border-border-tan'
                        }`}
                        placeholder="#FF0000"
                      />
                    </div>
                    {errors[`variant_${index}_colorHex`] && (
                      <p className="mt-0.5 text-xs text-red-600">{errors[`variant_${index}_colorHex`]}</p>
                    )}
                  </div>
                </div>

                {/* Price, Compare-at, Stock row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-white text-sm text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                        errors[`variant_${index}_price`] ? 'border-red-400' : 'border-border-tan'
                      }`}
                      placeholder="3200"
                    />
                    {errors[`variant_${index}_price`] && (
                      <p className="mt-0.5 text-xs text-red-600">{errors[`variant_${index}_price`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1">Compare-at Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={variant.compareAtPrice}
                      onChange={(e) => updateVariant(index, 'compareAtPrice', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-white text-sm text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                        errors[`variant_${index}_compareAtPrice`] ? 'border-red-400' : 'border-border-tan'
                      }`}
                      placeholder="4500 (strikethrough)"
                    />
                    {errors[`variant_${index}_compareAtPrice`] && (
                      <p className="mt-0.5 text-xs text-red-600">{errors[`variant_${index}_compareAtPrice`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1">Stock *</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-white text-sm text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                        errors[`variant_${index}_stock`] ? 'border-red-400' : 'border-border-tan'
                      }`}
                      placeholder="10"
                    />
                    {errors[`variant_${index}_stock`] && (
                      <p className="mt-0.5 text-xs text-red-600">{errors[`variant_${index}_stock`]}</p>
                    )}
                  </div>
                </div>

                {/* Discount and SKU row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1">Discount %</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="99"
                      value={variant.discount.percentage}
                      onChange={(e) => updateVariantDiscount(index, 'percentage', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md bg-white text-sm text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                        errors[`variant_${index}_discountPercentage`] ? 'border-red-400' : 'border-border-tan'
                      }`}
                      placeholder="0"
                    />
                    {errors[`variant_${index}_discountPercentage`] && (
                      <p className="mt-0.5 text-xs text-red-600">{errors[`variant_${index}_discountPercentage`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1">Discount Label</label>
                    <input
                      type="text"
                      value={variant.discount.label}
                      onChange={(e) => updateVariantDiscount(index, 'label', e.target.value)}
                      maxLength={50}
                      className="w-full px-3 py-2 border border-border-tan rounded-md bg-white text-sm text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                      placeholder="e.g. Summer Sale"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-dark/60 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      maxLength={50}
                      className={`w-full px-3 py-2 border rounded-md bg-white text-sm text-text-dark placeholder:text-text-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors ${
                        errors[`variant_${index}_sku`] ? 'border-red-400' : 'border-border-tan'
                      }`}
                      placeholder="ZRV-TOTE-RED-001"
                    />
                    {errors[`variant_${index}_sku`] && (
                      <p className="mt-0.5 text-xs text-red-600">{errors[`variant_${index}_sku`]}</p>
                    )}
                  </div>
                </div>

                {/* Image Upload for this variant */}
                <VariantImageUpload
                  images={variant.images}
                  onImagesChange={(images) => updateVariantImages(index, images)}
                  variantName={variant.colorName || `Variant ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ===== IMAGE UPLOAD SECTION ===== */}
        {/* Images are now uploaded inline with each variant above */}

        {/* ===== SUBMIT ===== */}
        <div className="flex items-center gap-3 pt-4 border-t border-border-tan">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : isEditMode ? (
              'Update Product'
            ) : (
              'Create Product'
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            disabled={isLoading}
            className="px-6 py-2.5 border border-border-tan rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
