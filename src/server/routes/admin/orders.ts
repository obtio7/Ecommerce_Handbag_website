import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Order, { VALID_TRANSITIONS } from '../../models/Order.js';
import adminAuth from '../../middleware/adminAuth.js';
import { sendOrderStatusUpdate } from '../../services/emailService.js';

const router = Router();

// Apply adminAuth middleware to all routes
router.use(adminAuth);

/**
 * GET /api/admin/orders
 * List orders with pagination, sorting, filtering by status, and search by customerEmail or order ID.
 * Query params: page (default 1), pageSize (default 20), status, search
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 20));
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const filter: Record<string, unknown> = {};

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Search by customerEmail or order ID
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchConditions: Record<string, unknown>[] = [
        { customerEmail: { $regex: searchTerm, $options: 'i' } },
      ];

      // Check if search term is a valid ObjectId (order ID lookup)
      if (mongoose.Types.ObjectId.isValid(searchTerm)) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
      }

      filter.$or = searchConditions;
    }

    const total = await Order.countDocuments(filter);
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.json({
      data: orders,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * GET /api/admin/orders/:id
 * Get full order detail including items, shipping address, payment info, and status history.
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    const order = await Order.findById(id).lean();

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order detail:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status with validation against VALID_TRANSITIONS map.
 * - Validates the transition is allowed
 * - Appends to statusHistory with timestamp
 * - Records shippedAt when status transitions to "shipped"
 * - Saves tracking number and URL when provided
 * - Returns error for invalid transitions
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status: newStatus, trackingNumber, trackingUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid order ID' });
      return;
    }

    if (!newStatus || typeof newStatus !== 'string') {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const currentStatus = order.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      res.status(400).json({
        error: `Invalid status transition from "${currentStatus}" to "${newStatus}"`,
        allowedTransitions: allowedTransitions || [],
      });
      return;
    }

    // Update status
    order.status = newStatus;

    // Update tracking info if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (trackingUrl) {
      order.trackingUrl = trackingUrl;
    }

    // Append to statusHistory
    const historyNote = trackingNumber ? `Tracking: ${trackingNumber}` : undefined;
    order.statusHistory.push({
      status: newStatus,
      changedAt: new Date(),
      note: historyNote,
    });

    // Record shippedAt when status transitions to "shipped"
    if (newStatus === 'shipped') {
      order.shippedAt = new Date();
    }

    // Record deliveredAt when status transitions to "delivered"
    if (newStatus === 'delivered') {
      order.deliveredAt = new Date();
    }

    // Record cancelledAt when status transitions to "cancelled"
    if (newStatus === 'cancelled') {
      order.cancelledAt = new Date();
    }

    await order.save();

    // Send status update email (non-blocking)
    sendOrderStatusUpdate(
      {
        _id: order._id.toString(),
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        totalAmount: order.totalAmount,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
      },
      newStatus
    ).catch(console.error);

    res.json({
      message: 'Order status updated successfully',
      order: order.toObject(),
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
