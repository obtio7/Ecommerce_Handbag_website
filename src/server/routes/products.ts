import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const router = Router();

/**
 * GET /api/products
 * List active products with pagination and optional category/tag filter.
 * Query params: page (default 1), pageSize (default 20), category (optional), tag (optional)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
    const category = req.query.category as string | undefined;
    const tag = req.query.tag as string | undefined;

    const filter: Record<string, unknown> = { isActive: true };
    if (category) {
      filter.category = category;
    }
    if (tag) {
      filter.tags = tag;
    }

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    const data = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.json({
      data,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/products/:id
 * Get a single active product by MongoDB _id with all variants.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await Product.findOne({ _id: id, isActive: true }).lean();

    if (!product) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
