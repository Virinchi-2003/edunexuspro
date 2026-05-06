import { Request, Response } from 'express';
import { db } from '../config/database';
import { attendance, students, staff, classes, schools } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, count, sql, isNull, like } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';
import { generateAttendanceReportPDF } from '../utils/pdfGenerator';

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

  const school = await db.query.schools.findFirst({ where: eq(schools.id, schoolId) });

  let whereClause = eq(attendance.schoolId, schoolId);
  if (date) whereClause = and(whereClause, eq(attendance.date, date)) as any;
  
  if (type === 'student') whereClause = and(whereClause, isNull(attendance.staffId)) as any;
  if (type === 'staff') whereClause = and(whereClause, isNull(attendance.studentId)) as any;

  const records = await db.query.attendance.findMany({
    where: whereClause,
    with: {
        student: true,
        staff: true
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Attendance_Report_${date}.pdf`);

  generateAttendanceReportPDF({
    schoolName: school?.name || 'EduNexus School',
    date: date || 'Today',
    type: type || 'overall',
    records
  }, res);
});

export const getMonthlyAttendanceStats = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const month = getSingleValue(req.query.month); // Format: YYYY-MM
  
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  const result = await db.query.attendance.findMany({
    where: and(
      eq(attendance.schoolId, schoolId),
      like(attendance.date, `${targetMonth}%`)
    )
  });

  // Process results into day-wise stats
  const stats: any = {};
  result.forEach(r => {
    if (!stats[r.date]) {
      stats[r.date] = { date: r.date, present: 0, absent: 0, total: 0 };
    }
    stats[r.date].total++;
    if (r.status === 'present') stats[r.date].present++;
    else if (r.status === 'absent') stats[r.date].absent++;
  });

  const formattedStats = Object.values(stats).sort((a: any, b: any) => a.date.localeCompare(b.date));

  res.status(200).json({ status: 'success', data: formattedStats });
});

export const markAttendanceByQR = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, qrData, classId, date, status, remarks } = req.body;
  console.log(`[QR SCAN] Received scan for school ${schoolId}. Data: ${qrData?.substring(0, 100)}...`);
  
  const { verifyStudentQRToken } = await import('../services/qrService');

  let resolvedStudentId: string | null = null;
  let qrPayload: any = null;

  // Try parsing as JSON first
  try {
    qrPayload = JSON.parse(qrData);
    if (qrPayload && qrPayload.type === 'student' && qrPayload.studentId) {
      console.log(`[QR SCAN] Detected JSON payload for studentId: ${qrPayload.studentId}`);
      resolvedStudentId = qrPayload.studentId;
    }
  } catch (e) {
    // Not JSON, continue with other methods
  }

  const today = new Date().toISOString().split('T')[0];
  const recordDate = date || today;

  // 2. Resolve Student
  let student: any = null;
  
  if (resolvedStudentId) {
    // Try resolving by readable studentId from JSON
    student = await db.query.students.findFirst({
      where: and(eq(students.studentId, resolvedStudentId), eq(students.schoolId, schoolId))
    });
  }

  if (!student) {
    // Try 1: Verify as secure JWT token
    const jwtStudentUuid = verifyStudentQRToken(qrData);
    if (jwtStudentUuid) {
      student = await db.query.students.findFirst({
        where: and(eq(students.id, jwtStudentUuid), eq(students.schoolId, schoolId))
      });
    }
  }

  if (!student) {
    // Try 2: Check if qrData is a raw UUID
    student = await db.query.students.findFirst({
      where: and(eq(students.id, qrData), eq(students.schoolId, schoolId))
    });
  }

  if (!student) {
     // Try 3: Check if qrData itself is the readable studentId
     student = await db.query.students.findFirst({
       where: and(eq(students.studentId, qrData), eq(students.schoolId, schoolId))
     });
  }

  // Verification: Ensure student belongs to this school
  if (student && student.schoolId !== schoolId) {
    console.error(`[QR SCAN ERROR] School mismatch! Student ${student.name} belongs to ${student.schoolId}, but scan was for ${schoolId}`);
    return res.status(403).json({ status: 'error', message: 'Student belongs to a different institution' });
  }

  if (!student) {
    console.warn(`[QR SCAN ERROR] Student not found for data: ${qrData?.slice(0, 50)}... in school ${schoolId}`);
    return res.status(404).json({ status: 'error', message: 'Student not recognized in this school' });
  }

  console.log(`[QR SCAN] Final Resolution - Student UUID: ${student.id}, Class ID: ${classId || student.classId}, Date: ${recordDate}`);

  // Use the resolved student's UUID for the attendance record
  const resolvedId = student.id;

  // 3. Check if already marked for today
  const existing = await db.query.attendance.findFirst({
    where: and(
      eq(attendance.schoolId, schoolId),
      eq(attendance.date, recordDate),
      eq(attendance.studentId, resolvedId)
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
    studentId: resolvedId,
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
