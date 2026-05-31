import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order, { generateOrderNumber } from '../models/Order.js';
import Payment from '../models/Payment.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { sendOrderConfirmation } from '../services/emailService.js';

const router = Router();

// Initialize Razorpay instance lazily (env vars may not be available at import time)
let razorpay: Razorpay | null = null;

function getRazorpay(): Razorpay | null {
  if (razorpay) return razorpay;
  
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    return null;
  }
  
  try {
    razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    console.log('Razorpay initialized with key:', keyId);
    return razorpay;
  } catch (error) {
    console.error('Failed to initialize Razorpay:', error);
    return null;
  }
}

interface OrderRequestBody {
  items: Array<{
    productId: string;
    variantId: string;
    name: string;
    color: string;
    originalPrice: number;
    price: number;
    quantity: number;
    imageUrl: string;
    sku: string;
  }>;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalAmount: number;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress: {
    fullName: string;
    address: string;
    city: string;
    state?: string;
    zipCode: string;
    phone?: string;
  };
  userId?: string;
}

/**
 * POST /api/payments/order
 * Create a Razorpay order for checkout.
 * Validates cart items and shipping address, creates Order in MongoDB,
 * creates Razorpay order, and returns order details to frontend.
 */
router.post('/order', async (req: Request, res: Response) => {
  try {
    const {
      items,
      subtotal,
      discountAmount,
      shippingCost,
      totalAmount,
      customerEmail,
      customerName,
      customerPhone,
      shippingAddress,
      userId,
    } = req.body as OrderRequestBody;

    // Validate non-empty cart items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate shipping address
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.zipCode
    ) {
      return res.status(400).json({ error: 'Shipping address is incomplete' });
    }

    // Validate customer email
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    // Validate customerName
    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    // Validate totalAmount
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    // Check if Razorpay is configured
    const rp = getRazorpay();
    if (!rp) {
      return res.status(502).json({ error: 'Payment service unavailable' });
    }

    // Generate human-readable order number
    const orderNumber = generateOrderNumber();

    // Create Order in MongoDB with status "placed"
    const order = await Order.create({
      orderNumber,
      userId: userId || 'guest',
      customerEmail,
      customerName,
      customerPhone,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        color: item.color,
        originalPrice: item.originalPrice,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        sku: item.sku,
      })),
      subtotal: subtotal || totalAmount,
      discountAmount: discountAmount || 0,
      shippingCost: shippingCost || 0,
      totalAmount,
      status: 'placed',
      shippingAddress,
      statusHistory: [{ status: 'placed', changedAt: new Date() }],
    });

    // Create Razorpay order (amount in paise = totalAmount × 100, currency INR)
    const amountInPaise = Math.round(totalAmount * 100);
    const receipt = `rcpt_${order._id}`;

    let razorpayOrder;
    try {
      razorpayOrder = await rp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt.substring(0, 40),
      });
    } catch (razorpayError: any) {
      console.error('Razorpay order creation failed:', {
        error: razorpayError?.message || razorpayError,
        timestamp: new Date().toISOString(),
        amount: amountInPaise,
      });

      // Clean up the order we created
      await Order.findByIdAndDelete(order._id);

      return res.status(502).json({ error: 'Payment service unavailable' });
    }

    // Update Order with razorpayOrderId
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // Create Payment record with status "pending"
    await Payment.create({
      orderId: order._id,
      userId: userId || 'guest',
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: 'INR',
      status: 'pending',
      customerEmail,
    });

    // Return response to frontend
    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature and update order/payment status.
 * After successful verification, update user stats (orderCount, totalSpent).
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    const missingFields: Record<string, string> = {};
    if (!razorpay_order_id) {
      missingFields.razorpay_order_id = 'razorpay_order_id is required';
    }
    if (!razorpay_payment_id) {
      missingFields.razorpay_payment_id = 'razorpay_payment_id is required';
    }
    if (!razorpay_signature) {
      missingFields.razorpay_signature = 'razorpay_signature is required';
    }

    if (Object.keys(missingFields).length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: missingFields,
      });
    }

    // Ensure Razorpay secret is configured
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('RAZORPAY_KEY_SECRET is not configured');
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Compute HMAC SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    // Find the payment record by razorpayOrderId
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

    if (!payment) {
      console.error(`Orphaned payment verification attempt: razorpay_order_id=${razorpay_order_id}, razorpay_payment_id=${razorpay_payment_id}`);
      return res.status(404).json({ error: 'Payment record not found' });
    }

    // Find the associated order
    const order = await Order.findById(payment.orderId);

    if (!order) {
      console.error(`Orphaned payment: Order not found for payment ${payment._id}, razorpay_order_id=${razorpay_order_id}`);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Compare signatures
    if (generatedSignature === razorpay_signature) {
      // Signature matches — payment verified successfully

      // Update Payment status to "paid" and store Razorpay details + userId
      await Payment.findByIdAndUpdate(payment._id, {
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        userId: order.userId,
      });

      // Update Order status to "confirmed" and append to statusHistory
      await Order.findByIdAndUpdate(order._id, {
        status: 'confirmed',
        paymentId: razorpay_payment_id,
        $push: {
          statusHistory: { status: 'confirmed', changedAt: new Date() },
        },
      });

      // Atomically decrement stock for each item's variant
      const stockErrors: string[] = [];
      for (const item of order.items) {
        const result = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            'variants._id': item.variantId,
            'variants.stock': { $gte: item.quantity },
          },
          { $inc: { 'variants.$.stock': -item.quantity } },
          { new: true }
        );

        if (!result) {
          stockErrors.push(`Insufficient stock for product: ${item.name} (variantId: ${item.variantId})`);
        }
      }

      if (stockErrors.length > 0) {
        console.warn('Stock decrement issues during payment verification:', stockErrors);
      }

      // Update user stats for the authenticated user ID
      if (order.userId && order.userId !== 'guest') {
        try {
          await User.findOneAndUpdate(
            { userId: order.userId },
            {
              $inc: { orderCount: 1, totalSpent: order.totalAmount },
              $setOnInsert: {
                userId: order.userId,
                email: order.customerEmail,
                name: order.customerName || order.shippingAddress.fullName,
              },
            },
            { upsert: true, new: true }
          );
        } catch (userError) {
          console.error('Failed to update user stats:', userError);
        }
      }

      // Send order confirmation email (non-blocking)
      sendOrderConfirmation({
        _id: order._id.toString(),
        customerEmail: order.customerEmail,
        items: order.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress,
      }).catch((err) =>
        console.error('[EmailService] Failed to send order confirmation:', err)
      );

      return res.json({
        success: true,
        orderId: order._id,
        message: 'Payment verified successfully',
      });
    } else {
      // Signature mismatch — mark payment as failed
      await Payment.findByIdAndUpdate(payment._id, {
        status: 'failed',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });

      // Update Order status to "payment-failed"
      await Order.findByIdAndUpdate(order._id, {
        status: 'payment-failed',
        $push: {
          statusHistory: { status: 'payment-failed', changedAt: new Date(), note: 'Payment verification failed - signature mismatch' },
        },
      });

      return res.status(400).json({
        error: 'Payment verification failed',
        message: 'Signature mismatch',
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/cancel
 * Cancel a pending payment/order when user closes payment modal without completing.
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ error: 'razorpay_order_id is required' });
    }

    // Find the payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Only cancel if still pending
    if (payment.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot cancel payment', 
        message: `Payment is already ${payment.status}` 
      });
    }

    // Update payment status
    payment.status = 'cancelled';
    await payment.save();

    // Update order status
    const order = await Order.findById(payment.orderId);
    if (order && order.status === 'placed') {
      order.status = 'cancelled';
      order.statusHistory.push({
        status: 'cancelled',
        changedAt: new Date(),
        note: 'Payment cancelled by user',
      });
      await order.save();
    }

    return res.json({ success: true, message: 'Payment cancelled' });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/webhook
 *
 * Razorpay webhook endpoint for receiving payment status notifications.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const receivedSignature = req.headers['x-razorpay-signature'] as string;

    if (!receivedSignature) {
      console.warn(
        `[Webhook] Missing signature header | IP: ${req.ip} | Timestamp: ${new Date().toISOString()}`
      );
      return res.status(400).json({ error: 'Missing signature header' });
    }

    const rawBody: string = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    let isSignatureValid = false;
    try {
      isSignatureValid = crypto.timingSafeEqual(
        Buffer.from(receivedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn(
        `[Webhook] Invalid signature | IP: ${req.ip} | Timestamp: ${new Date().toISOString()}`
      );
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const body = Buffer.isBuffer(req.body) || typeof req.body === 'string'
      ? JSON.parse(rawBody)
      : req.body;

    const event: string = body.event;
    const paymentEntity = body?.payload?.payment?.entity;

    if (!paymentEntity) {
      return res.status(200).json({ status: 'ignored', reason: 'No payment entity in payload' });
    }

    const razorpayPaymentId: string = paymentEntity.id;
    const razorpayOrderId: string = paymentEntity.order_id;

    if (event === 'payment.captured') {
      const payment = await Payment.findOne({ razorpayOrderId });

      if (!payment) {
        console.warn(
          `[Webhook] Payment not found for razorpayOrderId: ${razorpayOrderId}`
        );
        return res.status(200).json({ status: 'ignored', reason: 'Payment record not found' });
      }

      if (payment.status === 'paid') {
        return res.status(200).json({ status: 'already_processed' });
      }

      payment.status = 'paid';
      payment.razorpayPaymentId = razorpayPaymentId;
      await payment.save();

      const order = await Order.findById(payment.orderId);
      if (order && order.status === 'placed') {
        order.status = 'confirmed';
        order.statusHistory.push({
          status: 'confirmed',
          changedAt: new Date(),
        });
        await order.save();
      }

      return res.status(200).json({ status: 'processed', event: 'payment.captured' });

    } else if (event === 'payment.failed') {
      const payment = await Payment.findOne({ razorpayOrderId });

      if (!payment) {
        console.warn(
          `[Webhook] Payment not found for razorpayOrderId: ${razorpayOrderId}`
        );
        return res.status(200).json({ status: 'ignored', reason: 'Payment record not found' });
      }

      if (payment.status === 'failed' || payment.status === 'paid') {
        return res.status(200).json({ status: 'already_processed' });
      }

      payment.status = 'failed';
      payment.razorpayPaymentId = razorpayPaymentId;
      await payment.save();

      // Update order status to payment-failed
      const order = await Order.findById(payment.orderId);
      if (order && (order.status === 'placed' || order.status === 'pending')) {
        order.status = 'payment-failed';
        order.statusHistory.push({
          status: 'payment-failed',
          changedAt: new Date(),
          note: 'Payment failed via Razorpay webhook',
        });
        await order.save();
      }

      return res.status(200).json({ status: 'processed', event: 'payment.failed' });

    } else {
      return res.status(200).json({ status: 'ignored', reason: `Unhandled event: ${event}` });
    }
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
