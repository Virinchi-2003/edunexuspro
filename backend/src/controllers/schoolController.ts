import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';

const schoolSchema = z.object({
  name: z.string().min(3),
  address: z.string(),
  contactEmail: z.string().email(),
  subscriptionPlan: z.enum(['starter', 'growth', 'pro', 'elite']),
});

export const createSchool = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validatedData = schoolSchema.parse(req.body);
  
  const schoolRef = await db.collection('schools').add({
    ...validatedData,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  res.status(201).json({ 
    status: 'success',
    id: schoolRef.id, 
    message: 'School created successfully' 
  });
});

export const getSchools = asyncHandler(async (req: AuthRequest, res: Response) => {
  const snapshot = await db.collection('schools').get();
  const schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  res.status(200).json({
    status: 'success',
    data: schools
  });
});
