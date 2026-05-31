import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import Product from '../../models/Product.js';
import adminAuth from '../../middleware/adminAuth.js';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../services/cloudinary.js';

const router = Router();

// Apply adminAuth middleware to all routes in this file
router.use(adminAuth);

// --- Multer configuration for image uploads (memory storage for Cloudinary) ---
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,
  },
});

// --- Validation helpers ---

interface ValidationErrors {
  [key: string]: string;
}

function validateProductData(body: any, isUpdate = false): ValidationErrors {
  const errors: ValidationErrors = {};

  // Name validation
  if (body.name !== undefined || !isUpdate) {
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.name = 'Name is required and must be between 1 and 100 characters';
    } else if (body.name.trim().length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }
  }

  // Description validation
  if (body.description !== undefined || !isUpdate) {
    if (!body.description || typeof body.description !== 'string' || body.description.trim().length === 0) {
      errors.description = 'Description is required and must be between 1 and 2000 characters';
    } else if (body.description.trim().length > 2000) {
      errors.description = 'Description must not exceed 2000 characters';
    }
  }

  // basePrice validation
  if (body.basePrice !== undefined || !isUpdate) {
    const basePrice = Number(body.basePrice);
    if (body.basePrice === undefined || body.basePrice === null || body.basePrice === '') {
      errors.basePrice = 'Base price is required';
    } else if (isNaN(basePrice) || basePrice < 0.01 || basePrice > 999999999.99) {
      errors.basePrice = 'Base price must be between 0.01 and 999999999.99';
    }
  }

  // Category validation
  if (body.category !== undefined || !isUpdate) {
    if (!body.category || typeof body.category !== 'string' || body.category.trim().length === 0) {
      errors.category = 'Category is required';
    } else if (body.category.trim().length > 50) {
      errors.category = 'Category must not exceed 50 characters';
    }
  }

  // Variants validation
  if (body.variants !== undefined || !isUpdate) {
    if (!body.variants || !Array.isArray(body.variants) || body.variants.length === 0) {
      errors.variants = 'At least one variant is required';
    } else if (body.variants.length > 20) {
      errors.variants = 'Cannot exceed 20 variants';
    } else {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/;
      const skus = new Set<string>();

      for (let i = 0; i < body.variants.length; i++) {
        const variant = body.variants[i];

        // Color validation
        if (!variant.color || !variant.color.name || typeof variant.color.name !== 'string' || variant.color.name.trim().length === 0) {
          errors.variants = `Variant at index ${i} must have a color name`;
          break;
        }
        if (!variant.color.hexCode || !hexRegex.test(variant.color.hexCode)) {
          errors.variants = `Variant at index ${i} must have a valid hex code (format: #RRGGBB)`;
          break;
        }

        // Price validation
        const price = Number(variant.price);
        if (variant.price === undefined || variant.price === null || isNaN(price) || price < 0.01) {
          errors.variants = `Variant at index ${i} must have a valid price`;
          break;
        }

        // Stock validation
        const stock = Number(variant.stock);
        if (variant.stock === undefined || variant.stock === null || isNaN(stock) || !Number.isInteger(stock) || stock < 0) {
          errors.variants = `Variant at index ${i} must have a valid stock (non-negative integer)`;
          break;
        }

        // SKU validation
        if (!variant.sku || typeof variant.sku !== 'string' || variant.sku.trim().length === 0) {
          errors.variants = `Variant at index ${i} must have a SKU`;
          break;
        }

        // SKU uniqueness within product
        if (skus.has(variant.sku.trim())) {
          errors.variants = `Variant at index ${i} has a duplicate SKU "${variant.sku}" within this product`;
          break;
        }
        skus.add(variant.sku.trim());
      }
    }
  }

  // Tags validation
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.tags = 'Tags must be an array';
    } else if (body.tags.length > 10) {
      errors.tags = 'Tags array cannot exceed 10 entries';
    }
  }

  // Featured validation
  if (body.featured !== undefined) {
    if (typeof body.featured !== 'boolean' && body.featured !== 'true' && body.featured !== 'false') {
      errors.featured = 'Featured must be a boolean value';
    }
  }

  return errors;
}

// --- Routes ---

/**
 * GET /api/admin/products
 * Paginated list of all products (20 per page), all fields including variants.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Product.countDocuments(),
    ]);

    res.json({
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/products
 * Create a new product with variants.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const errors = validateProductData(req.body, false);

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Validation failed', fields: errors });
      return;
    }

    const productData = {
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      basePrice: Number(req.body.basePrice),
      category: req.body.category.trim(),
      variants: req.body.variants.map((v: any) => ({
        color: { name: v.color.name.trim(), hexCode: v.color.hexCode },
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
        discount: v.discount ? {
          percentage: Number(v.discount.percentage),
          label: v.discount.label || undefined,
          startDate: v.discount.startDate || undefined,
          endDate: v.discount.endDate || undefined,
        } : undefined,
        images: v.images || [],
        stock: Number(v.stock),
        sku: v.sku.trim(),
      })),
      tags: req.body.tags || [],
      material: req.body.material || undefined,
      dimensions: req.body.dimensions || undefined,
      featured: req.body.featured === true || req.body.featured === 'true',
      isActive: req.body.isActive !== false && req.body.isActive !== 'false',
    };

    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const fields: ValidationErrors = {};
      for (const key of Object.keys(error.errors)) {
        fields[key] = error.errors[key].message;
      }
      res.status(400).json({ error: 'Validation failed', fields });
      return;
    }
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update an existing product including variants.
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const errors = validateProductData(req.body, true);

    if (Object.keys(errors).length > 0) {
      res.status(400).json({ error: 'Validation failed', fields: errors });
      return;
    }

    const updateData: any = {};

    if (req.body.name !== undefined) updateData.name = req.body.name.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description.trim();
    if (req.body.basePrice !== undefined) updateData.basePrice = Number(req.body.basePrice);
    if (req.body.category !== undefined) updateData.category = req.body.category.trim();
    if (req.body.variants !== undefined) {
      updateData.variants = req.body.variants.map((v: any) => ({
        _id: v._id || undefined, // preserve existing variant IDs if provided
        color: { name: v.color.name.trim(), hexCode: v.color.hexCode },
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
        discount: v.discount ? {
          percentage: Number(v.discount.percentage),
          label: v.discount.label || undefined,
          startDate: v.discount.startDate || undefined,
          endDate: v.discount.endDate || undefined,
        } : undefined,
        images: v.images || [],
        stock: Number(v.stock),
        sku: v.sku.trim(),
      }));
    }
    if (req.body.tags !== undefined) updateData.tags = req.body.tags;
    if (req.body.material !== undefined) updateData.material = req.body.material;
    if (req.body.dimensions !== undefined) updateData.dimensions = req.body.dimensions;
    if (req.body.featured !== undefined) {
      updateData.featured = req.body.featured === true || req.body.featured === 'true';
    }
    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive === true || req.body.isActive === 'true';
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json(updatedProduct);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const fields: ValidationErrors = {};
      for (const key of Object.keys(error.errors)) {
        fields[key] = error.errors[key].message;
      }
      res.status(400).json({ error: 'Validation failed', fields });
      return;
    }
    if (error.name === 'CastError') {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete a product by ID.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/products/:id/images
 * Upload product images to Cloudinary.
 * Accepts optional `variantId` query param to associate images with a specific variant.
 * Max 5MB per file, jpeg/png/webp only, max 10 files total per product.
 */
router.post('/:id/images', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const variantId = req.query.variantId as string | undefined;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Validation failed', fields: { images: 'No files uploaded' } });
      return;
    }

    if (!isCloudinaryConfigured()) {
      res.status(500).json({ error: 'Image hosting service not configured. Please set Cloudinary credentials.' });
      return;
    }

    // Upload each file to Cloudinary
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadToCloudinary(file.buffer, {
        folder: 'zarevielle/products',
      });
      urls.push(url);
    }

    // If variantId is provided, add images to that specific variant
    if (variantId) {
      const variant = product.variants.find((v: any) => v._id?.toString() === variantId);
      if (!variant) {
        res.status(404).json({ error: 'Variant not found' });
        return;
      }

      if ((variant.images?.length || 0) + urls.length > 10) {
        res.status(400).json({
          error: 'Validation failed',
          fields: { images: `Cannot exceed 10 images per variant. Currently ${variant.images?.length || 0}, trying to add ${urls.length}.` },
        });
        return;
      }

      // Push images to the specific variant
      await Product.findOneAndUpdate(
        { _id: id, 'variants._id': variantId },
        { $push: { 'variants.$.images': { $each: urls } } }
      );

      const updatedProduct = await Product.findById(id);
      const updatedVariant = updatedProduct?.variants.find((v: any) => v._id?.toString() === variantId);

      res.json({ urls, totalImages: updatedVariant?.images?.length || urls.length });
    } else {
      // Legacy: add to first variant if no variantId specified
      const firstVariant = product.variants[0];
      if (firstVariant) {
        if ((firstVariant.images?.length || 0) + urls.length > 10) {
          res.status(400).json({
            error: 'Validation failed',
            fields: { images: `Cannot exceed 10 images per variant.` },
          });
          return;
        }

        await Product.findOneAndUpdate(
          { _id: id, 'variants._id': firstVariant._id },
          { $push: { 'variants.$.images': { $each: urls } } }
        );
      }

      res.json({ urls, totalImages: (firstVariant?.images?.length || 0) + urls.length });
    }
  } catch (error: any) {
    if (error.name === 'CastError') {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    console.error('Error uploading images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
