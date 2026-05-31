import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import AdminUser from '../../models/AdminUser.js';
import Session from '../../models/Session.js';
import adminAuth from '../../middleware/adminAuth.js';

const router = Router();

/**
 * POST /api/admin/setup
 * One-time setup endpoint to create/reset the admin user.
 * Only works if no admin users exist OR can be used to reset.
 * Remove this endpoint in production.
 */
router.post('/setup', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  try {
    const { username, password } = req.body;

    if (!username || !password || password.length < 8) {
      res.status(400).json({ error: 'Username and password (min 8 chars) required' });
      return;
    }

    // Delete all existing admin users and create fresh
    await AdminUser.deleteMany({});
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await AdminUser.create({ username, passwordHash });

    res.json({ message: `Admin user "${admin.username}" created successfully` });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/login
 * Authenticate admin user with username and password.
 * - Validates input length (username 3–64, password 8–128)
 * - Checks account lockout (5 failed attempts in 15 min → lock 15 min)
 * - Compares password with bcrypt hash
 * - Creates session with opaque token on success
 * - Sets HTTP-only secure cookie (admin_session, 24h expiry)
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (
      !username ||
      typeof username !== 'string' ||
      username.length < 3 ||
      username.length > 64
    ) {
      res.status(400).json({ error: 'Username must be between 3 and 64 characters' });
      return;
    }

    if (
      !password ||
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 128
    ) {
      res.status(400).json({ error: 'Password must be between 8 and 128 characters' });
      return;
    }

    // Find admin user
    const admin = await AdminUser.findOne({ username });
    if (!admin) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Check account lockout
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const retryAfter = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 1000);
      res.status(429).json({ error: 'Account temporarily locked', retryAfter });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      admin.failedLoginAttempts += 1;
      if (admin.failedLoginAttempts >= 5) {
        admin.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }
      await admin.save();
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Successful login — reset failed attempts
    admin.failedLoginAttempts = 0;
    admin.lockedUntil = undefined;
    admin.lastLoginAt = new Date();
    await admin.save();

    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await Session.create({ token, adminId: admin._id, expiresAt });

    // Set HTTP-only secure cookie
    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({ username: admin.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/logout
 * Invalidate the current admin session and clear the cookie.
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.admin_session;

    if (token) {
      await Session.deleteOne({ token });
    }

    res.clearCookie('admin_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/session
 * Validate the current session and return admin info.
 * Protected by adminAuth middleware.
 */
router.get('/session', adminAuth, async (req: Request, res: Response) => {
  try {
    res.json({ username: req.admin!.username });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
