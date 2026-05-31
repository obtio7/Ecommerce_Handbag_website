import { Router, Request, Response } from 'express';
import Order from '../models/Order.js';

const router = Router();

/**
 * GET /api/orders/my
 * Fetch orders for a customer by email or userId.
 * Query params: ?email=xxx or ?userId=yyy
 */
router.get('/my', async (req: Request, res: Response) => {
  try {
    const { email, userId } = req.query;

    const query: Record<string, any> = {};
    if (typeof userId === 'string' && userId.trim()) {
      query.userId = userId.trim();
    } else if (typeof email === 'string' && email.trim()) {
      query.customerEmail = email.trim().toLowerCase();
    } else {
      return res.status(400).json({ error: 'email or userId query parameter is required' });
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
