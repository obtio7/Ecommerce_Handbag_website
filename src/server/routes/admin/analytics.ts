import { Router, Request, Response } from 'express';
import Order from '../../models/Order.js';
import Payment from '../../models/Payment.js';
import Product from '../../models/Product.js';
import adminAuth from '../../middleware/adminAuth.js';

const router = Router();

/**
 * GET /api/admin/analytics
 * Returns analytics data for the specified date range.
 * Query params:
 *   - startDate (ISO string, default: start of today)
 *   - endDate (ISO string, default: end of today)
 * Max range: 90 days.
 *
 * Response:
 * {
 *   ordersPlaced: number;
 *   ordersShipped: number;
 *   totalTransactions: number;
 *   totalRevenue: number;
 *   perProductRevenue: Array<{ productId: string; productName: string; amount: number }>;
 *   dailyTrend: Array<{ date: string; orders: number; revenue: number }>;
 * }
 */
router.get('/', adminAuth, async (req: Request, res: Response) => {
  try {
    // Parse date range from query params
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let startDate: Date;
    let endDate: Date;

    if (req.query.startDate) {
      startDate = new Date(req.query.startDate as string);
      if (isNaN(startDate.getTime())) {
        res.status(400).json({ error: 'Invalid startDate format' });
        return;
      }
    } else {
      startDate = todayStart;
    }

    if (req.query.endDate) {
      endDate = new Date(req.query.endDate as string);
      if (isNaN(endDate.getTime())) {
        res.status(400).json({ error: 'Invalid endDate format' });
        return;
      }
      // Set endDate to end of that day
      endDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    } else {
      endDate = todayEnd;
    }

    // Validate max 90-day range
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      res.status(400).json({ error: 'Date range cannot exceed 90 days' });
      return;
    }

    if (startDate > endDate) {
      res.status(400).json({ error: 'startDate must be before or equal to endDate' });
      return;
    }

    // 1. Orders placed count (orders created within the date range)
    const ordersPlaced = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // 2. Orders shipped count (orders where shippedAt falls within the date range)
    const ordersShipped = await Order.countDocuments({
      shippedAt: { $gte: startDate, $lte: endDate },
    });

    // 3. Total transactions (paid payments count within date range)
    const totalTransactions = await Payment.countDocuments({
      status: 'paid',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // 4. Total revenue (sum of paid payment amounts within date range)
    const revenueResult = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // 5. Per-product revenue (aggregation pipeline: unwind items, group by productId, sum price×quantity)
    const perProductRevenueRaw = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: 'cancelled' },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          amount: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          unitsSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { amount: -1 } },
    ]);

    // Lookup product names for the aggregated product IDs
    const productIds = perProductRevenueRaw.map((item) => item._id);
    const products = await Product.find({ _id: { $in: productIds } }).select('name').lean();
    const productNameMap = new Map(products.map((p) => [p._id.toString(), p.name]));

    const perProductRevenue = perProductRevenueRaw.map((item) => ({
      productId: item._id.toString(),
      productName: productNameMap.get(item._id.toString()) || 'Unknown Product',
      amount: item.amount,
      unitsSold: item.unitsSold,
    }));

    // 6. Daily trend (orders and revenue per day)
    const dailyOrdersTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyRevenueTrend = await Payment.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge daily orders and revenue into a single dailyTrend array
    const revenueByDate = new Map(dailyRevenueTrend.map((item) => [item._id, item.revenue]));
    const ordersByDate = new Map(dailyOrdersTrend.map((item) => [item._id, item.orders]));

    // Collect all unique dates from both aggregations
    const allDates = new Set([...ordersByDate.keys(), ...revenueByDate.keys()]);
    const dailyTrend = Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        orders: ordersByDate.get(date) || 0,
        revenue: revenueByDate.get(date) || 0,
      }));

    // 7. Low stock products (stock < 5)
    const allProducts = await Product.find({ isActive: true }).select('name variants').lean();
    const lowStockProducts = allProducts
      .map((p: any) => {
        const totalStock = p.variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
        const variantStocks = p.variants.map((v: any) => ({
          color: v.color?.name || 'Default',
          stock: v.stock || 0,
        }));
        return {
          _id: p._id.toString(),
          name: p.name,
          totalStock,
          variants: variantStocks,
        };
      })
      .filter((p: any) => p.totalStock < 5)
      .sort((a: any, b: any) => a.totalStock - b.totalStock);

    // 8. Recent orders (last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('customerEmail totalAmount status createdAt')
      .lean();

    // 9. Total unique customers
    const totalCustomers = await Order.distinct('customerEmail').then((emails) => emails.length);

    res.json({
      ordersPlaced,
      ordersShipped,
      totalTransactions,
      totalRevenue,
      perProductRevenue,
      dailyTrend,
      lowStockProducts,
      recentOrders: recentOrders.map((o: any) => ({
        _id: o._id.toString(),
        customerEmail: o.customerEmail,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
      })),
      totalCustomers,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
