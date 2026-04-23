import { Request, Response } from 'express';
import { turso } from '../config/database';
import { schoolSchema } from '../models/schoolModel';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export const createSchool = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = schoolSchema.parse(req.body);
  const id = uuidv4();

  await turso.execute({
    sql: `INSERT INTO schools (id, name, address, contactEmail, subscriptionPlan, status) 
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      id, 
      validatedData.name, 
      validatedData.address, 
      validatedData.contactEmail, 
      validatedData.subscriptionPlan, 
      'active'
    ]
  });

  const result = await turso.execute({
    sql: "SELECT * FROM schools WHERE id = ?",
    args: [id]
  });

  res.status(201).json({
    status: 'success',
    data: result.rows[0]
  });
});

export const getSchools = asyncHandler(async (_req: Request, res: Response) => {
  const result = await turso.execute("SELECT * FROM schools ORDER BY createdAt DESC");
  
  res.status(200).json({
    status: 'success',
    data: result.rows
  });
});
