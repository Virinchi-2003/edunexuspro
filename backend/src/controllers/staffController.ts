import { Request, Response } from 'express';
import { db } from '../config/database';
import { staff, users, teacherClassAssignments, classes, students } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const getStaffBySchool = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.staff.findMany({
    where: eq(staff.schoolId, schoolId)
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getStaffByUserId = asyncHandler(async (req: Request, res: Response) => {
  const userId = getSingleValue(req.params.userId);
  const result = await db.query.staff.findFirst({
    where: eq(staff.userId, userId)
  });
  if (!result) {
    return res.status(404).json({ status: 'error', message: 'Staff profile not found' });
  }
  res.status(200).json({ status: 'success', data: result });
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const { 
    schoolId, name, email, password, department, role, 
    dob, subjects, classes: teachingClasses, branch, salary 
  } = req.body;
  
  const id = uuidv4();
  const userId = uuidv4();

  const userRole = 'staff'; // All staff use the staff portal role

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
    role: userRole,
    schoolId,
    status: 'active'
  }).onConflictDoUpdate({
    target: users.email,
    set: { 
      name, 
      password: password || 'staff123',
      role: userRole,
      updatedAt: new Date().toISOString()
    }
  });

  res.status(201).json({ status: 'success', data: newStaff });
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const updateData = req.body;

  if (updateData.salary) {
    updateData.salary = parseInt(updateData.salary.toString());
  }

  // Find existing staff to get userId
  const existingStaff = await db.query.staff.findFirst({ where: eq(staff.id, id) });
  if (!existingStaff) {
    return res.status(404).json({ status: 'error', message: 'Staff member not found' });
  }

  await db.update(staff)
    .set({ ...updateData, updatedAt: new Date().toISOString() })
    .where(eq(staff.id, id));

  // Sync with users table
  if (existingStaff.userId) {
    const userUpdate: any = {
      name: updateData.name || existingStaff.name,
      email: updateData.email || existingStaff.email,
      updatedAt: new Date().toISOString()
    };
    if (updateData.password) {
      userUpdate.password = updateData.password;
    }
    await db.update(users)
      .set(userUpdate)
      .where(eq(users.uid, existingStaff.userId));
  }

  res.status(200).json({ status: 'success', message: 'Staff updated successfully' });
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  
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

export const assignClasses = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, classIds } = req.body;

  // 1. Delete old assignments
  await db.delete(teacherClassAssignments).where(eq(teacherClassAssignments.teacherId, teacherId));

  // 2. Insert new ones
  if (classIds && classIds.length > 0) {
    const values = classIds.map((classId: string) => ({
      id: uuidv4(),
      teacherId,
      classId
    }));
    await db.insert(teacherClassAssignments).values(values);
  }

  res.status(200).json({ status: 'success', message: 'Classes assigned successfully' });
});

export const getTeacherClasses = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = getSingleValue(req.params.teacherId);

  const result = await db.query.teacherClassAssignments.findMany({
    where: eq(teacherClassAssignments.teacherId, teacherId),
    with: {
      class: {
        with: {
          students: true
        }
      }
    }
  });

  // Transform to match requested response format
  const transformed = result.map(a => ({
    classId: a.classId,
    className: `${a.class.name}-${a.class.section}`,
    students: a.class.students
  }));

  res.status(200).json({ status: 'success', data: transformed });
});
