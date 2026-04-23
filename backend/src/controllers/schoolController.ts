import { Response } from 'express';
import { db } from '../config/firebase';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { School } from '@shared/types';

const schoolSchema = z.object({
  name: z.string().min(3),
  address: z.string(),
  contactEmail: z.string().email(),
  subscriptionPlan: z.enum(['starter', 'growth', 'pro', 'elite']),
});

export const createSchool = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = schoolSchema.parse(req.body);
    
    const schoolRef = await db.collection('schools').add({
      ...validatedData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ id: schoolRef.id, message: 'School created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getSchools = async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db.collection('schools').get();
    const schools = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
