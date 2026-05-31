import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Subscriber from '../models/Subscriber.js';
import { sendWelcomeEmail, sendUnsubscribeConfirmation } from '../services/emailService.js';

const router = Router();

/**
 * POST /api/newsletter/subscribe
 * Subscribe to the newsletter
 */
router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { email, name, source = 'footer' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if already subscribed
    const existingSubscriber = await Subscriber.findOne({ email: email.toLowerCase() });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return res.status(200).json({ 
          success: true, 
          message: 'You are already subscribed to our newsletter!' 
        });
      } else {
        // Reactivate subscription
        existingSubscriber.isActive = true;
        existingSubscriber.subscribedAt = new Date();
        existingSubscriber.unsubscribedAt = undefined;
        await existingSubscriber.save();

        // Send welcome back email
        try {
          await sendWelcomeEmail(email, name || 'Valued Customer');
        } catch (emailError) {
          console.error('[Newsletter] Failed to send welcome email:', emailError);
        }

        return res.json({ 
          success: true, 
          message: 'Welcome back! Your subscription has been reactivated.' 
        });
      }
    }

    // Generate unsubscribe token
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Create new subscriber
    const subscriber = new Subscriber({
      email: email.toLowerCase(),
      name,
      source,
      unsubscribeToken,
    });

    await subscriber.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name || 'Valued Customer');
    } catch (emailError) {
      console.error('[Newsletter] Failed to send welcome email:', emailError);
    }

    res.json({ 
      success: true, 
      message: 'Thank you for subscribing! Check your inbox for a welcome message.' 
    });
  } catch (error: any) {
    console.error('[Newsletter] Subscribe error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(200).json({ 
        success: true, 
        message: 'You are already subscribed to our newsletter!' 
      });
    }
    
    res.status(500).json({ error: 'Failed to subscribe. Please try again.' });
  }
});

/**
 * GET /api/newsletter/unsubscribe/:token
 * Unsubscribe from the newsletter
 */
router.get('/unsubscribe/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const subscriber = await Subscriber.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return res.status(404).json({ error: 'Invalid unsubscribe link' });
    }

    if (!subscriber.isActive) {
      return res.json({ 
        success: true, 
        message: 'You have already been unsubscribed.' 
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    // Send confirmation email
    try {
      await sendUnsubscribeConfirmation(subscriber.email);
    } catch (emailError) {
      console.error('[Newsletter] Failed to send unsubscribe confirmation:', emailError);
    }

    // Return HTML page for browser access
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Zarevielle</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #F5F2ED;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 60px 40px;
            border-radius: 24px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          h1 {
            font-family: Georgia, serif;
            font-size: 28px;
            letter-spacing: 4px;
            color: #5A5A40;
            margin: 0 0 20px;
          }
          p {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 30px;
          }
          a {
            display: inline-block;
            background: #5A5A40;
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 50px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-weight: bold;
          }
          a:hover {
            background: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>ZAREVIELLE</h1>
          <p>You have been successfully unsubscribed from our newsletter. We're sorry to see you go!</p>
          <a href="/">Return to Shop</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('[Newsletter] Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe. Please try again.' });
  }
});

export default router;
