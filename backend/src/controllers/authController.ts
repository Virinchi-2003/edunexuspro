import { Request, Response } from 'express';
import { db } from '../config/database';
import { users, schools, staff, principals, students } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { eq, and } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, schoolId } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password are required' });
  }

  // Find user by email and password
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), eq(users.password, password))
  });

  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }

  // If schoolId is provided, verify it (either UUID or human-readable SCH-XXX)
  if (schoolId) {
    const school = await db.query.schools.findFirst({
      where: (s, { or, eq }) => or(
        eq(s.id, schoolId),
        eq(s.school_id, schoolId)
      )
    });

    if (!school || user.schoolId !== school.id) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized: User does not belong to this School ID' });
    }
  } else if (user.role === 'principal') {
    // For principals, schoolId is mandatory
    return res.status(400).json({ status: 'error', message: 'School ID is required for Principal login' });
  }

  // Fetch school details to get the subscription plan
  const schoolDetails = user.schoolId ? await db.query.schools.findFirst({ where: eq(schools.id, user.schoolId) }) : null;

  // In production, we would return a JWT or Firebase token.
  // For this demo, we return a mock token and user info.
  res.status(200).json({
    status: 'success',
    token: `mock-token-${user.uid}`,
    data: {
      uid: user.uid,
      email: user.email,
      role: user.role,
      name: user.name,
      schoolId: user.schoolId,
      subscriptionPlan: schoolDetails?.subscriptionPlan || null,
      displayName: user.name || (user.role === 'admin' ? 'Admin User' : 'Principal'),
      preferences: {
        emailAlerts: user.emailAlerts,
        smsAlerts: user.smsAlerts,
        darkMode: user.darkMode,
        language: user.language
      }
    }
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ status: 'error', message: 'All password fields are required' });
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.uid, userId), eq(users.password, currentPassword))
  });

  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Current password is incorrect' });
  }

  await db.update(users)
    .set({ password: newPassword, updatedAt: new Date().toISOString() })
    .where(eq(users.uid, userId));

  res.status(200).json({ status: 'success', message: 'Password updated successfully' });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const uid = getSingleValue(req.params.uid);
  const { name, phone, preferences, photoURL } = req.body;

  await db.update(users)
    .set({ 
      name, 
      phoneNumber: phone,
      photoURL,
      emailAlerts: preferences?.emailAlerts ?? true,
      smsAlerts: preferences?.smsAlerts ?? false,
      darkMode: preferences?.darkMode ?? false,
      language: preferences?.language ?? 'English',
      updatedAt: new Date().toISOString() 
    })
    .where(eq(users.uid, uid));

  // If user is staff/teacher, sync photoURL to staff table
  const user = await db.query.users.findFirst({ where: eq(users.uid, uid) });
  if (user && (user.role === 'staff' || user.role === 'teacher')) {
    await db.update(staff)
      .set({ photoURL, name: name || user.name, updatedAt: new Date().toISOString() })
      .where(eq(staff.userId, uid));
  }

  res.status(200).json({ status: 'success', message: 'Profile updated successfully' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Email is required' });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!user) {
    return res.status(404).json({ status: 'error', message: 'User not found' });
  }

  // Generate a random 6-digit code
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

  await db.update(users)
    .set({ resetPasswordToken: token, resetPasswordExpires: expires })
    .where(eq(users.email, email));

  // In a real app, send email here. For now, we'll just log it.
  console.log(`Reset code for ${email}: ${token}`);

  res.status(200).json({ status: 'success', message: 'Reset code sent to email' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ status: 'error', message: 'All fields are required' });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!user) {
    return res.status(404).json({ status: 'error', message: 'User not found' });
  }

  if (user.resetPasswordToken !== token) {
    return res.status(400).json({ status: 'error', message: 'Invalid reset code' });
  }

  const expires = user.resetPasswordExpires ? new Date(user.resetPasswordExpires) : null;
  if (!expires || expires < new Date()) {
    return res.status(400).json({ status: 'error', message: 'Reset code has expired' });
  }

  await db.update(users)
    .set({ 
      password: newPassword, 
      resetPasswordToken: null, 
      resetPasswordExpires: null,
      updatedAt: new Date().toISOString() 
    })
    .where(eq(users.email, email));

  // Sync password to role-specific tables for consistency
  if (user.role === 'staff' || user.role === 'teacher') {
    await db.update(staff)
      .set({ password: newPassword, updatedAt: new Date().toISOString() })
      .where(eq(staff.userId, user.uid));
  } else if (user.role === 'principal') {
    await db.update(principals)
      .set({ password: newPassword, updatedAt: new Date().toISOString() })
      .where(eq(principals.userId, user.uid));
  } else if (user.role === 'student') {
    await db.update(students)
      .set({ password: newPassword, updatedAt: new Date().toISOString() })
      .where(eq(students.userId, user.uid));
  }

  res.status(200).json({ status: 'success', message: 'Password reset successfully' });
});
