import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { db } from '../config/database';
import { announcements } from '../db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { getSingleValue } from '../utils/queryHelper';
import { AuthRequest } from '../middleware/auth';

export const createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, title, content, type, priority, audience, attachmentUrl, attachmentName, postedBy } = req.body;

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
    audience: audience || 'all',
    attachmentUrl: attachmentUrl || null,
    attachmentName: attachmentName || null,
    postedBy: postedBy || null
  });

  res.status(201).json({
    status: 'success',
    data: { id, title, content, type, priority, audience, attachmentUrl, attachmentName, postedBy }
  });
});

export const getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const authReq = req as AuthRequest;
  const user = authReq.user;

  let whereClause;
  if (!user) {
    whereClause = eq(announcements.schoolId, schoolId);
  } else {
    const role = user.role?.toLowerCase();
    if (role === 'principal' || role === 'admin') {
      whereClause = eq(announcements.schoolId, schoolId);
    } else if (role === 'staff' || role === 'teacher' || role === 'coach' || role === 'accountant') {
      whereClause = and(
        eq(announcements.schoolId, schoolId),
        or(
          eq(announcements.audience, 'all'),
          eq(announcements.audience, 'staff')
        )
      );
    } else if (role === 'student' || role === 'parent') {
      whereClause = and(
        eq(announcements.schoolId, schoolId),
        or(
          eq(announcements.audience, 'all'),
          eq(announcements.audience, 'student')
        )
      );
    } else {
      whereClause = and(
        eq(announcements.schoolId, schoolId),
        eq(announcements.audience, 'all')
      );
    }
  }

  const result = await db.query.announcements.findMany({
    where: whereClause,
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
