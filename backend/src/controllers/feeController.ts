import { Request, Response } from 'express';
import { db } from '../config/database';
import { feeStructures } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const getFeeStructures = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.feeStructures.findMany({
    where: eq(feeStructures.schoolId, schoolId),
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, grade, amount, description } = req.body;
  const id = uuidv4();

  const newFee = {
    id,
    schoolId,
    grade,
    amount: parseInt(amount),
    description,
  };

  await db.insert(feeStructures).values(newFee);
  res.status(201).json({ status: 'success', data: newFee });
});

export const updateFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { grade, amount, description } = req.body;

  await db.update(feeStructures)
    .set({ 
      grade, 
      amount: parseInt(amount), 
      description,
      updatedAt: new Date().toISOString()
    })
    .where(eq(feeStructures.id, id));

  res.status(200).json({ status: 'success', message: 'Fee structure updated' });
});

export const deleteFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(feeStructures).where(eq(feeStructures.id, id));
  res.status(200).json({ status: 'success', message: 'Fee structure deleted' });
});
