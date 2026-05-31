import { Request, Response, NextFunction } from 'express';
import Session from '../models/Session.js';
import AdminUser, { IAdminUser } from '../models/AdminUser.js';

// Extend Express Request to include admin property
declare global {
  namespace Express {
    interface Request {
      admin?: IAdminUser;
    }
  }
}

/**
 * Admin authentication middleware.
 * Validates the admin_session cookie against MongoDB sessions.
 * - 401 if no token or invalid/expired session (does not disclose route existence)
 * - 403 if valid session but admin user not found
 * - Attaches req.admin for downstream handlers
 */
const adminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.admin_session;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const session = await Session.findOne({ token, expiresAt: { $gt: new Date() } });

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const admin = await AdminUser.findById(session.adminId);

  if (!admin) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  req.admin = admin;
  next();
};

export default adminAuth;
