import { Request, Response } from 'express';
import { db } from '../config/database';
import { staff, users } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';

export const getStaffBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const result = await db.query.staff.findMany({
    where: eq(staff.schoolId, schoolId)
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const { 
    schoolId, name, email, password, department, role, 
    dob, subjects, classes: teachingClasses, branch, salary 
  } = req.body;
  
  const id = uuidv4();
  const userId = uuidv4();

  const newStaff = {
    id,
    schoolId,
    userId,
    name,
    email,
    password: password || 'staff123',
    department,
    role,
    dob,
    subjects,
    classes: teachingClasses,
    branch,
    salary: salary ? parseInt(salary.toString()) : 0,
    status: 'active' as const,
  };

  await db.insert(staff).values(newStaff);

  // Create/Update user record for login
  await db.insert(users).values({
    uid: userId,
    email,
    password: password || 'staff123',
    name,
    role: department === 'teaching' ? 'teacher' : 'staff',
    schoolId,
    status: 'active'
  }).onConflictDoUpdate({
    target: users.email,
    set: { 
      name, 
      password: password || 'staff123',
      role: department === 'teaching' ? 'teacher' : 'staff',
      updatedAt: new Date().toISOString()
    }
  });

  res.status(201).json({ status: 'success', data: newStaff });
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  if (updateData.salary) {
    updateData.salary = parseInt(updateData.salary.toString());
  }

  await db.update(staff)
    .set({ ...updateData, updatedAt: new Date().toISOString() })
    .where(eq(staff.id, id));

  res.status(200).json({ status: 'success', message: 'Staff updated successfully' });
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const staffMember = await db.query.staff.findFirst({ where: eq(staff.id, id) });
  if (!staffMember) {
    return res.status(404).json({ status: 'error', message: 'Staff member not found' });
  }

  // Delete user record as well
  if (staffMember.userId) {
    await db.delete(users).where(eq(users.uid, staffMember.userId));
  }

  await db.delete(staff).where(eq(staff.id, id));
  res.status(200).json({ status: 'success', message: 'Staff member deleted' });
});
