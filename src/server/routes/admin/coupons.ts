import { Router, Request, Response } from 'express';
import Coupon from '../../models/Coupon.js';
import adminAuth from '../../middleware/adminAuth.js';

const router = Router();

// Apply adminAuth middleware to all routes
router.use(adminAuth);

/**
 * GET /api/admin/coupons
 * List all coupons.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ data: coupons });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/coupons
 * Create a new coupon.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { code, type, value, minOrderAmount, maxDiscount, usageLimit, isActive, expiresAt } = req.body;

    if (!code || !type || value == null || minOrderAmount == null || !usageLimit) {
      res.status(400).json({ error: 'Missing required fields: code, type, value, minOrderAmount, usageLimit' });
      return;
    }

    if (!['percentage', 'fixed'].includes(type)) {
      res.status(400).json({ error: 'Type must be "percentage" or "fixed"' });
      return;
    }

    // Check for duplicate code
    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (existing) {
      res.status(409).json({ error: 'A coupon with this code already exists.' });
      return;
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type,
      value,
      minOrderAmount,
      maxDiscount: maxDiscount || undefined,
      usageLimit,
      usedCount: 0,
      isActive: isActive !== false,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json(coupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/coupons/:id
 * Delete a coupon by ID.
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
