import { Request, Response } from 'express';
import { db } from '../config/database';
import { users } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { eq, and } from 'drizzle-orm';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password are required' });
  }

  // Find user by email and password
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), eq(users.password, password))
  });

  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
  }

  // In production, we would return a JWT or Firebase token.
  // For this demo, we return a mock token and user info.
  res.status(200).json({
    status: 'success',
    token: 'mock-token',
    data: {
      uid: user.uid,
      email: user.email,
      role: user.role,
      name: user.name,
      displayName: user.name || 'Admin User'
    }
  });
});
