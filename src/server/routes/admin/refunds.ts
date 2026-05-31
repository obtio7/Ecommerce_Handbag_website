import { Router, Request, Response } from 'express';
import Order from '../../models/Order.js';
import adminAuth from '../../middleware/adminAuth.js';
import Razorpay from 'razorpay';

const router = Router();

// Apply adminAuth middleware to all routes
router.use(adminAuth);

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

interface RefundRequest {
  _id: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  paymentId?: string;
  refundId?: string;
  processedAt?: string;
  processedBy?: string;
  adminNote?: string;
  createdAt: string;
}

/**
 * GET /api/admin/refunds
 * List all refund requests (derived from orders with refund status)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    
    // Build query - find orders that have refund requests
    const query: any = {
      $or: [
        { refundStatus: { $exists: true } },
        { status: 'refund-requested' },
        { status: 'refunded' },
      ],
    };
    
    if (status) {
      if (status === 'pending') {
        query.refundStatus = { $in: ['pending', undefined] };
        query.status = 'refund-requested';
      } else if (status === 'approved') {
        query.refundStatus = 'approved';
      } else if (status === 'rejected') {
        query.refundStatus = 'rejected';
      } else if (status === 'processed') {
        query.$or = [
          { refundStatus: 'processed' },
          { status: 'refunded' },
        ];
      }
    }
    
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'customer.email': searchRegex },
          { orderNumber: searchRegex },
        ],
      });
    }
    
    const orders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .lean();
    
    // Transform orders to refund requests
    const refunds: RefundRequest[] = orders.map(order => ({
      _id: order._id.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber || `#${order._id.toString().slice(-8).toUpperCase()}`,
      customerEmail: order.customer?.email || '',
      customerName: order.customer?.name || 'Unknown',
      amount: order.totalAmount,
      reason: order.refundReason || 'No reason provided',
      status: order.status === 'refunded' ? 'processed' : (order.refundStatus || 'pending'),
      paymentId: order.paymentId,
      refundId: order.refundId,
      processedAt: order.refundProcessedAt,
      processedBy: order.refundProcessedBy,
      adminNote: order.refundAdminNote,
      createdAt: order.refundRequestedAt || order.updatedAt || order.createdAt,
    }));
    
    res.json({
      data: refunds,
      total: refunds.length,
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({ error: 'Failed to fetch refunds' });
  }
});

/**
 * POST /api/admin/refunds/:id/approve
 * Approve a refund request
 */
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'refund-requested') {
      return res.status(400).json({ error: 'Order is not in refund-requested status' });
    }
    
    order.refundStatus = 'approved';
    order.refundAdminNote = adminNote || '';
    await order.save();
    
    res.json({ message: 'Refund approved successfully' });
  } catch (error) {
    console.error('Error approving refund:', error);
    res.status(500).json({ error: 'Failed to approve refund' });
  }
});

/**
 * POST /api/admin/refunds/:id/reject
 * Reject a refund request
 */
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'refund-requested') {
      return res.status(400).json({ error: 'Order is not in refund-requested status' });
    }
    
    order.refundStatus = 'rejected';
    order.refundAdminNote = adminNote || '';
    order.status = 'delivered'; // Revert to delivered status
    await order.save();
    
    res.json({ message: 'Refund rejected' });
  } catch (error) {
    console.error('Error rejecting refund:', error);
    res.status(500).json({ error: 'Failed to reject refund' });
  }
});

/**
 * POST /api/admin/refunds/:id/process
 * Process an approved refund through Razorpay
 */
router.post('/:id/process', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.refundStatus !== 'approved') {
      return res.status(400).json({ error: 'Refund must be approved before processing' });
    }
    
    if (!order.paymentId) {
      return res.status(400).json({ error: 'No payment ID found for this order' });
    }
    
    // Process refund through Razorpay
    try {
      const refund = await razorpay.payments.refund(order.paymentId, {
        amount: order.totalAmount * 100, // Convert to paise
        speed: 'normal',
        notes: {
          orderId: order._id.toString(),
          reason: order.refundReason || 'Customer requested refund',
        },
      });
      
      order.refundId = refund.id;
      order.refundStatus = 'processed';
      order.refundProcessedAt = new Date().toISOString();
      order.refundAdminNote = adminNote || order.refundAdminNote;
      order.status = 'refunded';
      await order.save();
      
      res.json({ 
        message: 'Refund processed successfully',
        refundId: refund.id,
      });
    } catch (razorpayError: any) {
      console.error('Razorpay refund error:', razorpayError);
      
      // If Razorpay fails, still allow manual marking as refunded
      if (req.body.forceProcess) {
        order.refundStatus = 'processed';
        order.refundProcessedAt = new Date().toISOString();
        order.refundAdminNote = `${adminNote || ''} [Manual refund - Razorpay error: ${razorpayError.message}]`;
        order.status = 'refunded';
        await order.save();
        
        return res.json({ 
          message: 'Refund marked as processed (manual)',
          warning: 'Razorpay refund failed - please process manually',
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to process refund through Razorpay',
        details: razorpayError.message,
        hint: 'You can force process by setting forceProcess: true',
      });
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

export default router;
