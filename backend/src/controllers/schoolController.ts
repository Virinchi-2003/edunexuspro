import { Request, Response } from 'express';
import { db } from '../config/database';
import { schools, users, leads } from '../db/schema';
import { schoolSchema } from '../models/schoolModel';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { desc, eq } from 'drizzle-orm';

export const createSchool = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, contactEmail, subscriptionPlan, adminEmail, password } = req.body;
  const id = uuidv4();

  // 1. Create the School
  await db.insert(schools).values({
    id,
    name,
    address,
    contactEmail,
    subscriptionPlan,
    status: 'active',
  });

  // 2. Create the Admin User for this school
  const userId = uuidv4(); 
  await db.insert(users).values({
    uid: userId,
    email: adminEmail || contactEmail,
    role: 'principal',
    schoolId: id,
    status: 'active',
  });

  const result = await db.query.schools.findFirst({
    where: eq(schools.id, id)
  });

  res.status(201).json({
    status: 'success',
    message: 'School registered and admin account created.',
    data: result
  });
});

export const getSchools = asyncHandler(async (_req: Request, res: Response) => {
  const allSchools = await db.query.schools.findMany({
    orderBy: [desc(schools.createdAt)]
  });
  
  res.status(200).json({
    status: 'success',
    data: allSchools
  });
});

export const updateSchoolStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({ status: 'error', message: 'Invalid status' });
  }

  await db.update(schools)
    .set({ status: status as 'active' | 'suspended' | 'pending', updatedAt: new Date().toISOString() })
    .where(eq(schools.id, id as string));

  res.status(200).json({
    status: 'success',
    message: `School status updated to ${status}`
  });
});

export const updateSchool = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, address, contactEmail, subscriptionPlan } = req.body;

  await db.update(schools)
    .set({ 
      name, 
      address, 
      contactEmail, 
      subscriptionPlan,
      updatedAt: new Date().toISOString() 
    })
    .where(eq(schools.id, id as string));

  res.status(200).json({
    status: 'success',
    message: 'School details updated successfully'
  });
});

export const deleteSchool = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await db.delete(schools).where(eq(schools.id, id as string));

  res.status(200).json({
    status: 'success',
    message: 'School deleted successfully'
  });
});

export const syncLeadsToSchools = asyncHandler(async (_req: Request, res: Response) => {
  // 1. Fetch all leads that are paid but not yet converted
  const paidLeads = await db.query.leads.findMany({
    where: (l, { and, eq, ne }) => and(
      eq(l.paymentStatus, 'paid'),
      ne(l.status, 'converted')
    )
  });

  if (paidLeads.length === 0) {
    return res.status(200).json({ 
      status: 'success', 
      message: 'Database already in sync. No new paid plans found.' 
    });
  }

  let syncedCount = 0;

  for (const lead of paidLeads) {
    const schoolId = uuidv4();
    
    // Create School
    await db.insert(schools).values({
      id: schoolId,
      name: lead.schoolName,
      address: 'Auto-synced from Paid Lead',
      contactEmail: lead.email,
      subscriptionPlan: lead.plan || 'starter',
      status: 'active'
    });

    // Create Principal account
    await db.insert(users).values({
      uid: uuidv4(),
      email: lead.email,
      role: 'principal',
      schoolId: schoolId,
      status: 'active'
    });

    // Update Lead Status to converted
    await db.update(leads)
      .set({ status: 'converted' })
      .where(eq(leads.id, lead.id));
      
    syncedCount++;
  }

  res.status(200).json({
    status: 'success',
    message: `Database synchronized successfully! ${syncedCount} new schools added from paid plans.`,
    syncedCount
  });
});
