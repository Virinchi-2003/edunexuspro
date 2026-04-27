import { Request, Response } from 'express';
import { db } from '../config/database';
import { classes, students } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql } from 'drizzle-orm';

export const getClassesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const result = await db.query.classes.findMany({
    where: eq(classes.schoolId, schoolId)
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, name, section, roomNumber } = req.body;
  const id = uuidv4();

  const newClass = {
    id,
    schoolId,
    name,
    section,
    roomNumber,
  };

  await db.insert(classes).values(newClass);
  res.status(201).json({ status: 'success', data: newClass });
});

export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  await db.update(classes)
    .set({ ...updateData, updatedAt: new Date().toISOString() })
    .where(eq(classes.id, id));

  res.status(200).json({ status: 'success', message: 'Class updated successfully' });
});

export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const existingClass = await db.query.classes.findFirst({ where: eq(classes.id, id) });
  if (!existingClass) {
    return res.status(404).json({ status: 'error', message: 'Class not found' });
  }

  await db.delete(classes).where(eq(classes.id, id));
  res.status(200).json({ status: 'success', message: 'Class deleted successfully' });
});
