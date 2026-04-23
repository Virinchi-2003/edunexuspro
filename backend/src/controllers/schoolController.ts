import { Request, Response } from 'express';
import { db, isMockMode } from '../config/firebase';
import { schoolSchema } from '../models/schoolModel';
import { asyncHandler } from '../middleware/errorHandler';
import * as mockDb from '../config/mockDb';

export const createSchool = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = schoolSchema.parse(req.body);

  if (isMockMode) {
    const newItem = mockDb.saveToCollection('schools', {
      ...validatedData,
      status: 'active',
    });
    return res.status(201).json({
      status: 'success',
      data: newItem
    });
  }

  const schoolRef = await db.collection('schools').add({
    ...validatedData,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const newSchool = await schoolRef.get();
  res.status(201).json({
    status: 'success',
    data: { id: schoolRef.id, ...newSchool.data() }
  });
});

export const getSchools = asyncHandler(async (_req: Request, res: Response) => {
  if (isMockMode) {
    const schools = mockDb.getCollection('schools');
    return res.status(200).json({
      status: 'success',
      data: schools
    });
  }

  const snapshot = await db.collection('schools').get();
  const schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.status(200).json({
    status: 'success',
    data: schools
  });
});
