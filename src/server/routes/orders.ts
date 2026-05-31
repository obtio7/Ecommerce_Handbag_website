import { Router, Request, Response } from 'express';
import Order from '../models/Order.js';

const router = Router();

/**
 * GET /api/orders/my
 * Fetch orders for a customer by email.
 * Query params: ?email=xxx
 */
router.get('/my', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }

    const orders = await Order.find({ customerEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
