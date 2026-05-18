import { Request, Response } from 'express';
import { db } from '../config/database';
import { schools, users, leads, principals } from '../db/schema';
import { schoolSchema } from '../models/schoolModel';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { desc, eq, sql } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const createSchool = asyncHandler(async (req: Request, res: Response) => {
  const { name, address, contactEmail, subscriptionPlan, adminEmail, password, school_id: providedId } = req.body;
  
  // Check if email already exists
  const targetEmail = adminEmail || contactEmail;
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, targetEmail)
  });

  if (existingUser) {
    return res.status(400).json({ 
      status: 'error', 
      message: `An account with the email ${targetEmail} already exists. Please use a different administrator email.` 
    });
  }

  const id = uuidv4();

  // Generate or use provided human-readable School ID
  let school_id = providedId;
  if (!school_id) {
    const [lastSchool] = await db.select({ count: sql`count(*)` }).from(schools);
    const schoolCount = Number((lastSchool as any)?.count || 0) + 1;
    school_id = `SCH-${String(schoolCount).padStart(3, '0')}`;
  }

  // 1. Create the School
  await db.insert(schools).values({
    id,
    school_id,
    name,
    address,
    contactEmail,
    subscriptionPlan,
    status: 'active',
  });

  // 2. Create the Admin User for this school (Principal role)
  const userId = uuidv4(); 
  const defaultPassword = password || 'school123';
  
  await db.insert(users).values({
    uid: userId,
    email: adminEmail || contactEmail,
    password: defaultPassword,
    role: 'principal',
    schoolId: id,
    status: 'active',
    name: `Principal of ${name}`
  });

  // 3. Also add to principals table for management
  await db.insert(principals).values({
    id: uuidv4(),
    schoolId: id,
    name: `Principal of ${name}`,
    email: adminEmail || contactEmail,
    password: defaultPassword,
    phone: 'Not provided',
    userId: userId,
    status: 'active'
  });

  const result = await db.query.schools.findFirst({
    where: eq(schools.id, id)
  });

  res.status(201).json({
    status: 'success',
    message: `School registered with ID: ${school_id}. Admin account created.`,
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

export const getPublicSchools = asyncHandler(async (_req: Request, res: Response) => {
  const allSchools = await db.select({
    id: schools.id,
    name: schools.name,
    school_id: schools.school_id
  }).from(schools).where(eq(schools.status, 'active'));
  
  res.status(200).json({
    status: 'success',
    data: allSchools
  });
});

export const getSchoolById = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const result = await db.query.schools.findFirst({
    where: eq(schools.id, id)
  });

  if (!result) {
    return res.status(404).json({ status: 'error', message: 'School not found' });
  }

  res.status(200).json({
    status: 'success',
    data: result
  });
});

export const updateSchoolStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status } = req.body;

  if (!['active', 'suspended', 'pending'].includes(status)) {
    return res.status(400).json({ status: 'error', message: 'Invalid status' });
  }

  await db.update(schools)
    .set({ status: status as 'active' | 'suspended' | 'pending', updatedAt: new Date().toISOString() })
    .where(eq(schools.id, id));

  res.status(200).json({
    status: 'success',
    message: `School status updated to ${status}`
  });
});
export const updateSchool = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { name, address, contactEmail, subscriptionPlan, currentAcademicYear, school_id, academicYears } = req.body;

  await db.update(schools)
    .set({ 
      name, 
      address, 
      contactEmail, 
      subscriptionPlan,
      currentAcademicYear,
      school_id,
      academicYears,
      updatedAt: new Date().toISOString() 
    })
    .where(eq(schools.id, id));

  res.status(200).json({
    status: 'success',
    message: 'School details updated successfully'
  });
});


export const updateSchoolPlan = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { subscriptionPlan } = req.body;

  await db.update(schools)
    .set({ subscriptionPlan, updatedAt: new Date().toISOString() })
    .where(eq(schools.id, id));

  res.status(200).json({
    status: 'success',
    message: 'School details updated successfully'
  });
});

export const deleteSchool = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(schools).where(eq(schools.id, id));
  res.status(200).json({ status: 'success', message: 'School deleted successfully' });
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
    const userId = uuidv4();
    
    // Generate a human-readable School ID
    const [lastSchool] = await db.select({ count: sql`count(*)` }).from(schools);
    const schoolCount = Number((lastSchool as any)?.count || 0) + 1;
    const school_id = `SCH-${String(schoolCount).padStart(3, '0')}`;

    const defaultPassword = 'school' + Math.floor(1000 + Math.random() * 9000);
    
    // Create School
    await db.insert(schools).values({
      id: schoolId,
      school_id,
      name: lead.schoolName,
      address: 'Auto-synced from Paid Lead',
      contactEmail: lead.email,
      subscriptionPlan: lead.plan || 'starter',
      status: 'active'
    });

    // Create User record for login
    await db.insert(users).values({
      uid: userId,
      email: lead.email,
      password: defaultPassword,
      role: 'principal',
      schoolId: schoolId,
      status: 'active',
      name: lead.adminName || `Principal of ${lead.schoolName}`
    });

    // Create Principal record for management
    await db.insert(principals).values({
      id: uuidv4(),
      schoolId: schoolId,
      name: lead.adminName || `Principal of ${lead.schoolName}`,
      email: lead.email,
      password: defaultPassword,
      phone: lead.phone || 'Not provided',
      userId: userId,
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
