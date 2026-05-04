import { Request, Response } from 'express';
import { db } from '../config/database';
import { marks, attendance, students, homework, homeworkSubmissions } from '../db/schema';
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

  // 2. Fetch Performance Data (Average Percentage)
  const studentMarks = await db.query.marks.findMany({
    where: eq(marks.studentId, studentId)
  });

  const performance = studentMarks.reduce(
    (acc: { obtained: number; total: number }, curr: any) => {
      return {
        obtained: acc.obtained + (curr.marksObtained || 0),
        total: acc.total + (curr.totalMarks || 100)
      };
    },
    { obtained: 0, total: 0 }
  );

  const averagePerformance = performance.total > 0 
    ? ((performance.obtained / performance.total) * 100).toFixed(1) 
    : '0.0';

  // 3. Pending Homework
  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  let pendingHomeworkCount = 0;
  
  if (student?.classId) {
    const allHomework = await db.query.homework.findMany({
      where: eq(homework.classId, student.classId)
    });
    const submissions = await db.query.homeworkSubmissions.findMany({
      where: eq(homeworkSubmissions.studentId, studentId)
    });
    const submittedIds = submissions.map(s => s.homeworkId);
    pendingHomeworkCount = allHomework.filter(h => !submittedIds.includes(h.id)).length;
  }

  res.status(200).json({
    status: 'success',
    data: {
      attendance: todayAttendance || { status: 'Not Marked' },
      averagePerformance,
      pendingHomeworkCount
    }
  });
});
