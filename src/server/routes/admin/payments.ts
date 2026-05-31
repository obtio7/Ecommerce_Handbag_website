import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Payment from '../../models/Payment.js';
import adminAuth from '../../middleware/adminAuth.js';

const router = Router();

// Apply adminAuth middleware to all routes
router.use(adminAuth);

/**
 * GET /api/admin/payments
 * List payments with pagination, sorting, and filtering.
 * Query params:
 *   - page (default 1)
 *   - pageSize (default 20)
 *   - status (optional: paid | failed | pending | refunded)
 *   - startDate (optional ISO string)
 *   - endDate (optional ISO string)
 *
 * Returns: { data, total, page, pageSize, totalPages, totalRevenue }
 * totalRevenue = sum of amount for payments with status "paid" in the filtered set.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20));
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (status && ['paid', 'failed', 'pending', 'refunded'].includes(status)) {
      filter.status = status;
    }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          dateFilter.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          // Set end date to end of day for inclusive filtering
          end.setHours(23, 59, 59, 999);
          dateFilter.$lte = end;
        }
      }
      if (Object.keys(dateFilter).length > 0) {
        filter.createdAt = dateFilter;
      }
    }

    const skip = (page - 1) * pageSize;

    // Execute queries in parallel
    const [data, total, revenueResult] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Payment.countDocuments(filter),
      // Calculate total revenue for "paid" payments in the filtered set
      Payment.aggregate([
        { $match: { ...filter, status: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
      ]),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      data,
      total,
      page,
      pageSize,
      totalPages,
      totalRevenue,
    });
  } catch (error) {
    console.error('Admin payments list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/payments/:id
 * Get full payment detail including Razorpay fields.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid payment ID' });
      return;
    }

    const payment = await Payment.findById(id).lean();

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    res.json(payment);
  } catch (error) {
    console.error('Admin payment detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
