import { Request, Response } from 'express';
import { db } from '../config/database';
import { timetable, timetableSlots, rooms, staff } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, or } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const createTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, classId, name } = req.body;
  const id = uuidv4();
  
  const newTimetable = { id, schoolId, classId, name };
  await db.insert(timetable).values(newTimetable);
  
  res.status(201).json({ status: 'success', data: newTimetable });
});

export const getTimetables = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.timetable.findMany({
    where: eq(timetable.schoolId, schoolId),
    with: {
      slots: true
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

import { sendNotification } from '../utils/notificationService';

export const updateSlot = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, classId, dayOfWeek, startTime, endTime, subject, teacherId } = req.body;
  
  // 1. Find or Create Timetable for this Class
  let targetTimetable = await db.query.timetable.findFirst({
    where: and(
      eq(timetable.schoolId, schoolId),
      eq(timetable.classId, classId)
    )
  });

  let timetableId = targetTimetable?.id;

  if (!targetTimetable) {
    timetableId = uuidv4();
    await db.insert(timetable).values({
      id: timetableId,
      schoolId,
      classId,
      name: `Timetable for Class ${classId}`
    });
  }

  // 2. Conflict Detection
  const teacherConflict = await db.query.timetableSlots.findFirst({
    where: and(
      eq(timetableSlots.dayOfWeek, dayOfWeek),
      eq(timetableSlots.startTime, startTime),
      eq(timetableSlots.teacherId, teacherId)
    )
  });

  if (teacherConflict) {
    return res.status(400).json({ status: 'error', message: `Teacher is already busy during this time (${startTime})` });
  }

  const id = uuidv4();
  const newSlot = { id, timetableId: timetableId!, dayOfWeek, startTime, endTime, subject, teacherId };
  await db.insert(timetableSlots).values(newSlot);

  res.status(201).json({ status: 'success', data: newSlot });
});

export const getRooms = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.rooms.findMany({
    where: eq(rooms.schoolId, schoolId)
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, name, capacity, type } = req.body;
  const id = uuidv4();
  const newRoom = { id, schoolId, name, capacity, type };
  await db.insert(rooms).values(newRoom);
  res.status(201).json({ status: 'success', data: newRoom });
});
