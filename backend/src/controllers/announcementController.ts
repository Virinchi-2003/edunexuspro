import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../config/database';
import { announcements } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getSingleValue } from '../utils/queryHelper';

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, title, content, type, priority, attachmentUrl, attachmentName, postedBy } = req.body;

  if (!schoolId || !title || !content) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields' });
  }

  const id = uuidv4();
  
  await db.insert(announcements).values({
    id,
    schoolId,
    title,
    content,
    type: type || 'notice',
    priority: priority || 'medium',
    attachmentUrl: attachmentUrl || null,
    attachmentName: attachmentName || null,
    postedBy: postedBy || null
  });

  res.status(201).json({
    status: 'success',
    data: { id, title, content, type, priority, attachmentUrl, attachmentName, postedBy }
  });
});

export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);

  const result = await db.query.announcements.findMany({
    where: eq(announcements.schoolId, schoolId),
    with: {
      author: true
    },
    orderBy: [desc(announcements.postedAt)]
  });

  res.status(200).json({
    status: 'success',
    data: result
  });
});

export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);

  await db.delete(announcements).where(eq(announcements.id, id));

  res.status(200).json({
    status: 'success',
    message: 'Announcement deleted successfully'
  });
});
