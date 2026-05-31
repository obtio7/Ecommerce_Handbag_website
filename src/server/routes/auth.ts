import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import UserSession from '../models/UserSession.js';

const router = Router();
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function createSessionCookie(token: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: SESSION_DURATION_MS,
    path: '/',
  };
}

function mapUserForClient(user: any) {
  return {
    uid: user.userId,
    email: user.email,
    displayName: user.name,
    photoURL: user.photoURL || '',
  };
}

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name is required and must be at least 2 characters' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomBytes(16).toString('hex');

    const user = await User.create({
      userId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      passwordHash,
      orderCount: 0,
      totalSpent: 0,
      addresses: [],
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await UserSession.create({ token, userId: user.userId, expiresAt });
    res.cookie('user_session', token, createSessionCookie(token));

    res.json(mapUserForClient(user));
  } catch (error) {
    console.error('[Auth] Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await UserSession.create({ token, userId: user.userId, expiresAt });
    res.cookie('user_session', token, createSessionCookie(token));

    res.json(mapUserForClient(user));
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.user_session;
    if (token) {
      await UserSession.deleteOne({ token });
    }
    res.clearCookie('user_session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    res.json({ success: true });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/session', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.user_session;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await UserSession.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await User.findOne({ userId: session.userId });
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    res.json(mapUserForClient(user));
  } catch (error) {
    console.error('[Auth] Session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
