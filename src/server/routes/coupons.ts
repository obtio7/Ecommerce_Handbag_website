import { Router, Request, Response } from 'express';
import Coupon from '../models/Coupon.js';

const router = Router();

/**
 * POST /api/coupons/validate
 * Validates a coupon code against the cart total.
 * Body: { code: string, cartTotal: number }
 * Returns: { valid: true, discount: number, message: string } or { valid: false, message: string }
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || typeof code !== 'string') {
      res.json({ valid: false, message: 'Please enter a coupon code.' });
      return;
    }

    if (!cartTotal || typeof cartTotal !== 'number' || cartTotal <= 0) {
      res.json({ valid: false, message: 'Invalid cart total.' });
      return;
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      res.json({ valid: false, message: 'Invalid coupon code.' });
      return;
    }

    if (!coupon.isActive) {
      res.json({ valid: false, message: 'This coupon is no longer active.' });
      return;
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      res.json({ valid: false, message: 'This coupon has expired.' });
      return;
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      res.json({ valid: false, message: 'This coupon has reached its usage limit.' });
      return;
    }

    if (cartTotal < coupon.minOrderAmount) {
      res.json({
        valid: false,
        message: `Minimum order of ₹${coupon.minOrderAmount.toLocaleString('en-IN')} required for this coupon.`,
      });
      return;
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = Math.round((cartTotal * coupon.value) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      // fixed
      discount = coupon.value;
    }

    // Ensure discount doesn't exceed cart total
    if (discount > cartTotal) {
      discount = cartTotal;
    }

    const message =
      coupon.type === 'percentage'
        ? `${coupon.value}% off applied!`
        : `₹${coupon.value} off applied!`;

    res.json({ valid: true, discount, message });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ valid: false, message: 'Something went wrong. Please try again.' });
  }
});

export default router;
