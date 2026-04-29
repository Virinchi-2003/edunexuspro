import { Request, Response } from 'express';
import { db } from '../config/database';
import { marks, attendance, students } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { eq, and } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

/**
 * Interface for Student Dashboard Stats
 */
interface DashboardStats {
  attendance: {
    status: string;
    date?: string;
  };
  performance: {
    totalMarksObtained: number;
    totalPossibleMarks: number;
    percentage: string;
    grade: string;
  };
  summary: {
    pendingHomeworkCount: number;
    activeFlags: number;
  };
}

/**
 * Fetch and calculate student dashboard statistics
 * @route GET /api/portal/dashboard/:studentId
 */
export const getStudentDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const today = new Date().toISOString().split('T')[0];

  // 1. Fetch Today's Attendance
  const todayAttendance = await db.query.attendance.findFirst({
    where: and(
      eq(attendance.studentId, studentId),
      eq(attendance.date, today)
    )
  });

  // 2. Fetch Performance Data (Marks)
  const studentMarks = await db.select().from(marks).where(eq(marks.studentId, studentId));

  const performance = studentMarks.reduce(
    (acc: { obtained: number; total: number }, curr: typeof marks.$inferSelect) => {
      return {
        obtained: acc.obtained + (curr.marksObtained || 0),
        total: acc.total + (curr.totalMarks || 100)
      };
    },
    { obtained: 0, total: 0 }
  );

  const percentage = performance.total > 0 
    ? ((performance.obtained / performance.total) * 100).toFixed(1) 
    : '0.0';

  // Helper to determine grade based on percentage
  const calculateGrade = (pct: number): string => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  // 3. Construct Stats Response
  const stats: DashboardStats = {
    attendance: {
      status: todayAttendance?.status || 'Not Marked',
      date: todayAttendance?.date || today
    },
    performance: {
      totalMarksObtained: performance.obtained,
      totalPossibleMarks: performance.total,
      percentage,
      grade: calculateGrade(parseFloat(percentage))
    },
    summary: {
      pendingHomeworkCount: 3, // Mock value as per requirement for now
      activeFlags: 0
    }
  };

  res.status(200).json({
    status: 'success',
    data: stats
  });
});
