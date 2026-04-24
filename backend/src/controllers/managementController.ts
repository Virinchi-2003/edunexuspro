import { Request, Response } from 'express';
import { db } from '../config/database';
import { principals, subscriptions, schools, students, leads, users, configs } from '../db/schema';
import { principalSchema } from '../models/principalModel';
import { subscriptionSchema } from '../models/subscriptionModel';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, sql, count, desc, and } from 'drizzle-orm';
import * as z from 'zod';

const adminSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

// System Stats for Dashboard
export const getSystemStats = asyncHandler(async (_req: Request, res: Response) => {
  // 1. Total Schools
  const [schoolCount] = await db.select({ value: count() }).from(schools);
  
  // 2. Active Students
  const [studentCount] = await db.select({ value: count() }).from(students);
  
  // 3. Monthly Revenue (Estimated from subscription plans)
  const allSchools = await db.select({ plan: schools.subscriptionPlan }).from(schools).where(eq(schools.status, 'active'));
  const planPrices: any = {
    'starter': 4999,
    'growth': 9999,
    'pro': 18999,
    'elite': 50000
  };
  
  const monthlyRevenue = allSchools.reduce((acc, s) => {
    const price = planPrices[s.plan.toLowerCase()] || 0;
    return acc + price;
  }, 0);

  // 4. Recent Registrations
  const recentSchools = await db.query.schools.findMany({
    orderBy: [desc(schools.createdAt)],
    limit: 5
  });

  // 5. System Health
  const systemHealth = "99.9%";

  // 6. Real Uptime
  const uptimeSeconds = Math.floor(process.uptime());
  const days = Math.floor(uptimeSeconds / (24 * 3600));
  const hours = Math.floor((uptimeSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptime = `${days}d ${hours}h ${minutes}m`;

  res.status(200).json({
    status: 'success',
    data: {
      totalSchools: schoolCount.value,
      activeStudents: studentCount.value,
      monthlyRevenue: `₹${monthlyRevenue.toLocaleString()}`,
      systemHealth,
      uptime,
      recentSchools
    }
  });
});

export const getSystemConfig = asyncHandler(async (_req: Request, res: Response) => {
  const result = await db.query.configs.findMany();
  res.status(200).json({ status: 'success', data: result });
});

export const updateSystemConfig = asyncHandler(async (req: Request, res: Response) => {
  const { key, value } = req.body;

  await db.insert(configs)
    .values({ key, value, updatedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: configs.key,
      set: { value, updatedAt: new Date().toISOString() }
    });

  res.status(200).json({ status: 'success', message: 'System configuration updated' });
});

// Principal Controllers
export const createPrincipal = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = principalSchema.parse(req.body);
  const id = uuidv4();

  const newPrincipal = {
    id,
    ...validatedData,
    status: 'active' as const,
  };

  await db.insert(principals).values(newPrincipal);
  res.status(201).json({ status: 'success', data: newPrincipal });
});

export const getPrincipals = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.query;
  const result = schoolId 
    ? await db.query.principals.findMany({ where: eq(principals.schoolId, schoolId as string) })
    : await db.query.principals.findMany();
  
  res.status(200).json({ status: 'success', data: result });
});

export const updatePrincipal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = principalSchema.partial().parse(req.body);

  await db.update(principals)
    .set({ 
      ...validatedData, 
      updatedAt: new Date().toISOString() 
    })
    .where(eq(principals.id, id as string));

  res.status(200).json({ status: 'success', message: 'Principal updated successfully' });
});

export const deletePrincipal = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await db.delete(principals).where(eq(principals.id, id as string));
  res.status(200).json({ status: 'success', message: 'Principal deleted successfully' });
});

// Subscription Controllers
export const createSubscription = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = subscriptionSchema.parse(req.body);
  const id = uuidv4();

  const newSubscription = {
    id,
    ...validatedData,
    startDate: new Date(validatedData.startDate).toISOString(),
    endDate: new Date(validatedData.endDate).toISOString(),
  };

  await db.insert(subscriptions).values(newSubscription);
  res.status(201).json({ status: 'success', data: newSubscription });
});

export const getSubscriptions = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.query;
  const result = schoolId 
    ? await db.query.subscriptions.findMany({ where: eq(subscriptions.schoolId, schoolId as string) })
    : await db.query.subscriptions.findMany();
  
  res.status(200).json({ status: 'success', data: result });
});

export const updateSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = subscriptionSchema.partial().parse(req.body);

  await db.update(subscriptions)
    .set({ 
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate).toISOString() : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate).toISOString() : undefined,
      updatedAt: new Date().toISOString() 
    })
    .where(eq(subscriptions.id, id as string));

  res.status(200).json({ status: 'success', message: 'Subscription updated successfully' });
});

export const deleteSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await db.delete(subscriptions).where(eq(subscriptions.id, id as string));
  res.status(200).json({ status: 'success', message: 'Subscription deleted successfully' });
});

// Admin Management
export const getAdminUsers = asyncHandler(async (_req: Request, res: Response) => {
  const result = await db.query.users.findMany({
    where: eq(users.role, 'admin')
  });
  res.status(200).json({ status: 'success', data: result });
});

export const updateAdminProfile = asyncHandler(async (req: Request, res: Response) => {
  const { uid } = req.params;
  const validatedData = adminSchema.parse(req.body);

  await db.update(users)
    .set({ 
      ...validatedData,
      updatedAt: new Date().toISOString() 
    })
    .where(eq(users.uid, uid as string));

  res.status(200).json({ status: 'success', message: 'Admin profile updated' });
});

export const createNewAdmin = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = adminSchema.parse(req.body);
  if (!validatedData.password) {
    return res.status(400).json({ status: 'error', message: 'Password is required for new accounts' });
  }
  const uid = uuidv4(); // In production, this would be Firebase UID

  await db.insert(users).values({
    uid,
    name: validatedData.name,
    email: validatedData.email,
    phoneNumber: validatedData.phoneNumber,
    password: validatedData.password,
    role: 'admin',
    status: 'active'
  });

  res.status(201).json({ status: 'success', message: 'New admin account created' });
});

export const deleteAdminUser = asyncHandler(async (req: Request, res: Response) => {
  const { uid } = req.params;

  // Prevent deleting self? (Optional, but good practice)
  // if (uid === (req as any).user.uid) ...

  await db.delete(users).where(and(eq(users.uid, uid as string), eq(users.role, 'admin')));
  res.status(200).json({ status: 'success', message: 'Admin account removed' });
});

export const updateAdminPassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const { uid } = req.params;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ status: 'error', message: 'All password fields are required' });
  }

  const user = await db.query.users.findFirst({
    where: and(eq(users.uid, uid as string), eq(users.password, currentPassword))
  });

  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Incorrect current password' });
  }

  await db.update(users)
    .set({ password: newPassword, updatedAt: new Date().toISOString() })
    .where(eq(users.uid, uid as string));

  res.status(200).json({ status: 'success', message: 'Password updated successfully' });
});
