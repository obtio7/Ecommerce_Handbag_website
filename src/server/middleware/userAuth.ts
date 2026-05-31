import { Request, Response, NextFunction } from 'express';
import UserSession from '../models/UserSession.js';
import User, { IUser } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

const userAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.user_session;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const session = await UserSession.findOne({ token, expiresAt: { $gt: new Date() } });
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = await User.findOne({ userId: session.userId });
  if (!user) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  req.user = user;
  next();
};

export default userAuth;
