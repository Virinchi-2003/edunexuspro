import { Request, Response } from 'express';
import { db } from '../config/database';
import { students, attendance, examMarks } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { eq, and, sql } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const getStudentDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);

  // 1. Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = await db.query.attendance.findFirst({
    where: and(
      eq(attendance.studentId, studentId),
      eq(attendance.date, today)
    )
  });

  // 2. Get pending homework count (mock logic or actual if homework table exists)
  // For now, let's assume 3 pending homeworks as mock or count from a table
  const pendingHomeworkCount = 3; 

  // 3. Get average performance from exam marks
  const performanceRecords = await db.query.examMarks.findMany({
    where: eq(examMarks.studentId, studentId)
  });

  let averagePerformance = '0.0';
  if (performanceRecords.length > 0) {
    const total = performanceRecords.reduce((acc, curr) => acc + (curr.marksObtained / curr.totalMarks), 0);
    averagePerformance = ((total / performanceRecords.length) * 100).toFixed(1);
  }

  res.status(200).json({
    status: 'success',
    data: {
      attendance: todayAttendance || { status: 'Not Marked' },
      pendingHomeworkCount,
      averagePerformance
    }
  });
});
