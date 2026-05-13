import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { db } from '../config/database';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    role: string;
    schoolId?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1]!;
    
    // Support mock token for development/demo
    if (token.startsWith('mock-token-')) {
      const uid = token.replace('mock-token-', '');
      const user = await db.query.users.findFirst({ where: eq(users.uid, uid) });
      if (user) {
        req.user = {
          uid,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId || undefined,
        };
        return next();
      }
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: (decodedToken.role as string) || 'user',
      schoolId: decodedToken.schoolId as string,
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Forbidden: No user information found' 
      });
    }

    const userRole = req.user.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      console.warn(`[Auth] Role mismatch for ${req.user.email}: user has "${userRole}", needs one of [${allowedRoles.join(', ')}]`);
      return res.status(403).json({ 
        status: 'error', 
        message: 'Forbidden: You do not have permission to perform this action' 
      });
    }
    next();
  };
};

import { schools } from '../db/schema';
export const checkPlan = (requiredPlan: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.schoolId) {
      return res.status(403).json({ status: 'error', message: 'School identification missing' });
    }

    const school = await db.query.schools.findFirst({
      where: eq(schools.id, req.user.schoolId)
    });

    if (!school || school.subscriptionPlan?.toUpperCase() !== requiredPlan.toUpperCase()) {
      return res.status(403).json({ 
        status: 'error', 
        message: `This feature requires the ${requiredPlan} Plan. Please upgrade to access.` 
      });
    }

    next();
  };
};
