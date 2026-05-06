import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { turso } from '../config/database';
import { announcements, staff } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, title, content, type, priority, attachmentUrl, attachmentName, postedBy } = req.body;

  if (!schoolId || !title || !content) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields' });
  }

  const id = uuidv4();
  
  await turso.execute({
    sql: `INSERT INTO announcements (id, schoolId, title, content, type, priority, attachmentUrl, attachmentName, postedBy, postedAt, createdAt, updatedAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: [id, schoolId, title, content, type || 'notice', priority || 'medium', attachmentUrl || null, attachmentName || null, postedBy || null]
  });

  res.status(201).json({
    status: 'success',
    data: { id, title, content, type, priority, attachmentUrl, attachmentName, postedBy }
  });
});

export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  const result = await turso.execute({
    sql: `SELECT a.*, u.name as authorName 
          FROM announcements a
          LEFT JOIN users u ON a.postedBy = u.uid
          WHERE a.schoolId = ?
          ORDER BY a.postedAt DESC`,
    args: [schoolId]
  });

  res.status(200).json({
    status: 'success',
    data: result.rows
  });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await turso.execute({
    sql: `DELETE FROM announcements WHERE id = ?`,
    args: [id]
  });

  res.status(200).json({
    status: 'success',
    message: 'Announcement deleted successfully'
  });
});
