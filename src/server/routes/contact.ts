import { Router, Request, Response } from 'express';

const router = Router();

/**
 * POST /api/contact
 * Handle contact form submissions.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required (name, email, subject, message)' });
    }

    // Log the contact message (email sending can be added later)
    console.log('[Contact Form]', {
      name,
      email,
      subject,
      message: message.substring(0, 200),
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Your message has been received. We will get back to you soon.' });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
