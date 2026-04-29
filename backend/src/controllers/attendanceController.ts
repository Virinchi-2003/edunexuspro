import { Request, Response } from 'express';
import { db } from '../config/database';
import { attendance, students, staff, classes } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, count, sql, isNull } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const getAttendance = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const date = getSingleValue(req.query.date);
  const classId = getSingleValue(req.query.classId);

  let whereClause = eq(attendance.schoolId, schoolId);
  
  if (date) {
    whereClause = and(whereClause, eq(attendance.date, date)) as any;
  }
  
  if (classId) {
    whereClause = and(whereClause, eq(attendance.classId, classId)) as any;
  }

  const result = await db.query.attendance.findMany({
    where: whereClause,
    orderBy: [desc(attendance.date)]
  });

  res.status(200).json({ status: 'success', data: result });
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, records } = req.body; 

  if (!Array.isArray(records)) {
    return res.status(400).json({ status: 'error', message: 'Records must be an array' });
  }

  const today = new Date().toISOString().split('T')[0];

  for (const r of records) {
    const recordDate = r.date || today;
    
    // 1. Find existing record precisely to avoid cross-entity or NULL matching issues
    const existing = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.schoolId, schoolId),
        eq(attendance.date, recordDate),
        r.studentId 
          ? and(eq(attendance.studentId, r.studentId), isNull(attendance.staffId))
          : and(eq(attendance.staffId, r.staffId), isNull(attendance.studentId))
      )
    });

    if (existing) {
      await db.update(attendance)
        .set({ 
          status: r.status, 
          remarks: r.remarks || '',
          updatedAt: new Date().toISOString() 
        })
        .where(eq(attendance.id, existing.id));
    } else {
      await db.insert(attendance).values({
        id: uuidv4(),
        schoolId,
        studentId: r.studentId || null,
        staffId: r.staffId || null,
        classId: r.classId || null,
        status: r.status,
        date: recordDate,
        remarks: r.remarks || '',
      });
    }
  }

  res.status(201).json({ status: 'success', message: 'Attendance marked successfully' });
});

export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status, remarks } = req.body;

  await db.update(attendance)
    .set({ status, remarks, updatedAt: new Date().toISOString() })
    .where(eq(attendance.id, id));

  res.status(200).json({ status: 'success', message: 'Attendance record updated' });
});

export const deleteAttendance = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(attendance).where(eq(attendance.id, id));
  res.status(200).json({ status: 'success', message: 'Attendance record deleted' });
});

export const sendAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, date, type } = req.body; // type: 'student' | 'staff' | 'all'

  let whereClause = and(
    eq(attendance.schoolId, schoolId),
    eq(attendance.date, date),
    eq(attendance.status, 'absent')
  );

  const absentees = await db.query.attendance.findMany({
    where: whereClause as any,
    with: {
      student: true,
      staff: true
    }
  });

  if (absentees.length === 0) {
    return res.status(200).json({ status: 'success', message: 'No absentees found for this date' });
  }

  // Simulate sending real emails/SMS
  const results = absentees.map(a => {
    const isStudent = !!a.student;
    const recipient = isStudent ? a.student?.parentName || 'Parent' : a.staff?.name;
    const email = isStudent ? a.student?.email : a.staff?.email;
    const name = isStudent ? a.student?.name : a.staff?.name;
    
    const message = isStudent 
      ? `Dear ${recipient}, your child ${name} is marked ABSENT for today (${date}). Please contact the school office for any clarification.`
      : `Dear ${recipient}, you have been marked ABSENT for today (${date}).`;

    // In a real app, we would call an email API here (SendGrid, AWS SES, etc.)
    console.log(`[ALERT] Sending Email to: ${email}`);
    console.log(`[MESSAGE] ${message}`);

    return {
      id: a.id,
      recipient,
      email,
      target: isStudent ? `Parent of ${name}` : `Staff ${name}`,
      status: 'Sent',
      channel: 'Email',
      timestamp: new Date().toISOString()
    };
  });

  res.status(200).json({ 
    status: 'success', 
    message: `Successfully notified ${absentees.length} ${type === 'student' ? 'parents' : 'staff members'} via email.`,
    data: results 
  });
});

export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, date, type } = req.body; // type: 'student' | 'staff' | 'all'

  const allAttendance = await db.query.attendance.findMany({
    where: and(eq(attendance.schoolId, schoolId), eq(attendance.date, date)),
    with: {
        student: true,
        staff: true
    }
  });

  const stats = {
    total: allAttendance.length,
    present: allAttendance.filter(a => a.status === 'present').length,
    absent: allAttendance.filter(a => a.status === 'absent').length,
    late: allAttendance.filter(a => a.status === 'late').length
  };

  const reportId = uuidv4().slice(0, 8).toUpperCase();
  
  // Simulate sending report to principal
  console.log(`[REPORT] Generating ${type} attendance report for ${date}...`);
  console.log(`[REPORT] Report ID: ${reportId}`);
  console.log(`[REPORT] Stats: ${JSON.stringify(stats)}`);

  res.status(200).json({ 
    status: 'success', 
    message: `Attendance report (${reportId}) has been sent to your registered email.`,
    data: { reportId, stats }
  });
});

export const markAttendanceByQR = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, studentId, classId, date, status, remarks } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const recordDate = date || today;

  // 1. Validate student exists
  const student = await db.query.students.findFirst({
    where: and(eq(students.id, studentId), eq(students.schoolId, schoolId))
  });

  if (!student) {
    return res.status(404).json({ status: 'error', message: 'Student not found in this school' });
  }

  // 2. Check if already marked for today
  const existing = await db.query.attendance.findFirst({
    where: and(
      eq(attendance.schoolId, schoolId),
      eq(attendance.date, recordDate),
      eq(attendance.studentId, studentId)
    )
  });

  if (existing) {
    await db.update(attendance)
      .set({ 
        status: status || 'present', 
        remarks: remarks || 'Marked via QR',
        updatedAt: new Date().toISOString() 
      })
      .where(eq(attendance.id, existing.id));
    
    return res.status(200).json({ 
      status: 'success', 
      message: `${student.name} marked as ${status || 'present'} (Updated)`,
      data: student
    });
  }

  // 3. Insert new record
  await db.insert(attendance).values({
    id: uuidv4(),
    schoolId,
    studentId,
    classId: classId || student.classId,
    status: status || 'present',
    date: recordDate,
    remarks: remarks || 'Marked via QR',
  });

  res.status(201).json({ 
    status: 'success', 
    message: `${student.name} marked as ${status || 'present'}`,
    data: student
  });
});

export const getAttendanceByClass = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const classId = getSingleValue(req.params.classId);
  const date = getSingleValue(req.query.date);

  let whereClause = and(eq(attendance.schoolId, schoolId), eq(attendance.classId, classId));
  
  if (date) {
    whereClause = and(whereClause, eq(attendance.date, date)) as any;
  }

  const result = await db.query.attendance.findMany({
    where: whereClause,
    orderBy: [desc(attendance.date)],
    with: {
      student: true
    }
  });

  res.status(200).json({ status: 'success', data: result });
});

export const getStudentAttendance = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const result = await db.query.attendance.findMany({
    where: eq(attendance.studentId, studentId),
    orderBy: [desc(attendance.date)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getStaffAttendance = asyncHandler(async (req: Request, res: Response) => {
  const staffId = getSingleValue(req.params.staffId);
  const result = await db.query.attendance.findMany({
    where: eq(attendance.staffId, staffId),
    orderBy: [desc(attendance.date)]
  });
  res.status(200).json({ status: 'success', data: result });
});
