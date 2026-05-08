import { Request, Response } from 'express';
import { db } from '../config/database';
import { leaveRequests, students, staff, teacherClassAssignments, timetableSlots, classes } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';
import { evaluateLeaveRequest } from '../services/leaveAiService';

export const applyLeave = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, studentId, reason, startDate, endDate, templateType, totalDays } = req.body;

  if (!reason || !startDate || !endDate) {
    return res.status(400).json({ status: 'error', message: 'Missing required fields (reason, startDate, endDate)' });
  }

  // 1. Trigger AI Evaluation
  const aiDecision = await evaluateLeaveRequest(reason, startDate, endDate);

  const id = uuidv4();
  const newLeave = {
    id,
    schoolId,
    studentId,
    templateType: templateType || 'custom',
    reason,
    startDate,
    endDate,
    totalDays: totalDays || 0,
    status: (aiDecision.status === 'APPROVED' || aiDecision.status === 'REJECTED') 
            ? aiDecision.status.toLowerCase() 
            : 'pending',
    aiStatus: aiDecision.status,
    aiReason: aiDecision.reason,
    aiConfidence: aiDecision.confidence,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await db.insert(leaveRequests).values(newLeave as any);

  res.status(201).json({ 
    status: 'success', 
    message: aiDecision.status === 'APPROVED' 
             ? 'Your leave has been automatically approved by AI.' 
             : aiDecision.status === 'REJECTED' 
             ? 'Your leave was automatically rejected by AI.' 
             : 'Leave request submitted and pending review.',
    data: newLeave 
  });
});

export const getStudentLeaves = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const result = await db.query.leaveRequests.findMany({
    where: eq(leaveRequests.studentId, studentId),
    orderBy: [desc(leaveRequests.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getTeacherLeaves = asyncHandler(async (req: Request, res: Response) => {
  const staffId = getSingleValue(req.params.staffId);
  
  const teacher = await db.query.staff.findFirst({ where: eq(staff.id, staffId) });
  if (!teacher) return res.status(404).json({ status: 'error', message: 'Teacher not found' });

  // Logic to find student leaves for this teacher's classes
  const assignments = await db.query.teacherClassAssignments.findMany({ where: eq(teacherClassAssignments.teacherId, staffId) });
  const classIdsFromAssignments = assignments.map(a => a.classId);

  const timetableSlotsAll = await db.query.timetableSlots.findMany({
    where: eq(timetableSlots.teacherId, staffId),
    with: { timetable: true }
  });
  const classIdsFromTimetable = timetableSlotsAll.map(s => s.timetable?.classId).filter(Boolean) as string[];

  let classIdsFromStaffField: string[] = [];
  if (teacher.classes) {
    let legacyClasses: string[] = [];
    try {
      const parsed = JSON.parse(teacher.classes);
      if (Array.isArray(parsed)) legacyClasses = parsed;
    } catch (e) {
      legacyClasses = teacher.classes.split(',').map(s => s.trim()).filter(s => s);
    }
    
    const allClasses = await db.query.classes.findMany({
      where: eq(classes.schoolId, teacher.schoolId)
    });
    
    for (const a of legacyClasses) {
      const lowerA = a.toLowerCase().trim();
      const cleanA = lowerA.replace(/(\d+)(st|nd|rd|th)/i, '$1').replace(/[\s-]/g, '').replace(/^class/i, '');
      const matched = allClasses.filter(c => {
        const className = c.name.toLowerCase().trim();
        const sectionName = (c.section || '').toLowerCase().trim();
        const cleanClassName = className.replace(/(\d+)(st|nd|rd|th)/i, '$1');
        const cleanC = `${cleanClassName}${sectionName}`.replace(/[\s-]/g, '');
        return c.id === a || cleanA === cleanC || cleanA === cleanClassName || lowerA.includes(cleanC) || cleanA.includes(cleanC);
      });
      classIdsFromStaffField.push(...matched.map(m => m.id));
    }
  }

  const myClassIds = Array.from(new Set([...classIdsFromAssignments, ...classIdsFromTimetable, ...classIdsFromStaffField]));

  const myStudents = await db.query.students.findMany({
    where: inArray(students.classId, myClassIds.length > 0 ? myClassIds : ['none'])
  });

  const studentIds = myStudents.map(s => s.id);

  if (studentIds.length === 0) {
    return res.status(200).json({ status: 'success', data: [] });
  }

  const leaves = await db.query.leaveRequests.findMany({
    where: and(
      eq(leaveRequests.schoolId, teacher.schoolId),
      inArray(leaveRequests.studentId, studentIds)
    ),
    with: {
      student: true
    },
    orderBy: [desc(leaveRequests.createdAt)]
  });

  res.status(200).json({ status: 'success', data: leaves });
});

export const updateLeaveStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, teacherMessage, staffId } = req.body;
  const leaveId = getSingleValue(req.params.leaveId);

  if (!leaveId) {
    return res.status(400).json({ status: 'error', message: 'Leave ID is required' });
  }

  await db.update(leaveRequests)
    .set({ 
      status: status.toLowerCase(), 
      teacherMessage, 
      approvedBy: staffId,
      updatedAt: new Date().toISOString() 
    } as any)
    .where(eq(leaveRequests.id, leaveId));

  res.status(200).json({ status: 'success', message: `Leave ${status} successfully` });
});

export const getAllLeaves = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.leaveRequests.findMany({
    where: eq(leaveRequests.schoolId, schoolId),
    with: {
      student: true
    },
    orderBy: [desc(leaveRequests.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});
