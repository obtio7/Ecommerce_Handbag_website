import { Router, Request, Response } from 'express';
import Order from '../../models/Order.js';
import adminAuth from '../../middleware/adminAuth.js';

const router = Router();

// Apply adminAuth middleware to all routes
router.use(adminAuth);

/**
 * GET /api/admin/customers
 * Get list of all customers with their order history and stats
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Aggregate orders by customer email
    const customerData = await Order.aggregate([
      {
        $group: {
          _id: '$customerEmail',
          name: { $first: '$customerName' },
          phone: { $first: '$customerPhone' },
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' },
          orders: {
            $push: {
              _id: '$_id',
              orderNumber: '$orderNumber',
              totalAmount: '$totalAmount',
              status: '$status',
              createdAt: '$createdAt',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          email: '$_id',
          name: 1,
          phone: 1,
          totalOrders: 1,
          totalSpent: 1,
          lastOrderDate: 1,
          orders: { $slice: ['$orders', 10] }, // Limit to last 10 orders
        },
      },
      { $sort: { lastOrderDate: -1 } },
    ]);

    res.json({ data: customerData });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/customers/:email
 * Get detailed customer info by email
 */
router.get('/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const orders = await Order.find({ customerEmail: email })
      .sort({ createdAt: -1 })
      .lean();

    if (orders.length === 0) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const customer = {
      email,
      name: orders[0].customerName,
      phone: orders[0].customerPhone,
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0),
      lastOrderDate: orders[0].createdAt,
      orders: orders.map((o) => ({
        _id: o._id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
        items: o.items,
        shippingAddress: o.shippingAddress,
      })),
    };

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
