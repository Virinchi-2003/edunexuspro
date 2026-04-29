import { Request, Response } from 'express';
import { db } from '../config/database';
import { staff, users, teacherClassAssignments, classes, students, attendance, exams, timetableSlots } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const getStaffBySchool = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.staff.findMany({
    where: eq(staff.schoolId, schoolId)
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getStaffByUserId = asyncHandler(async (req: Request, res: Response) => {
  const userId = getSingleValue(req.params.userId);
  const result = await db.query.staff.findFirst({
    where: eq(staff.userId, userId)
  });
  if (!result) {
    return res.status(404).json({ status: 'error', message: 'Staff profile not found' });
  }
  res.status(200).json({ status: 'success', data: result });
});

export const createStaff = asyncHandler(async (req: Request, res: Response) => {
  const { 
    schoolId, name, email, password, department, role, 
    dob, subjects, classes: teachingClasses, branch, salary 
  } = req.body;
  
  const id = uuidv4();
  const userId = uuidv4();

  const userRole = 'staff'; // All staff use the staff portal role

  const newStaff = {
    id,
    schoolId,
    userId,
    name,
    email,
    password: password || 'staff123',
    department,
    role,
    dob,
    subjects,
    classes: teachingClasses,
    branch,
    salary: salary ? parseInt(salary.toString()) : 0,
    status: 'active' as const,
  };

  await db.insert(staff).values(newStaff);

  // Create/Update user record for login
  await db.insert(users).values({
    uid: userId,
    email,
    password: password || 'staff123',
    name,
    role: userRole,
    schoolId,
    status: 'active'
  }).onConflictDoUpdate({
    target: users.email,
    set: { 
      name, 
      password: password || 'staff123',
      role: userRole,
      updatedAt: new Date().toISOString()
    }
  });

  res.status(201).json({ status: 'success', data: newStaff });
});

export const updateStaff = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const updateData = req.body;

  if (updateData.salary) {
    updateData.salary = parseInt(updateData.salary.toString());
  }

  // Find existing staff to get userId
  const existingStaff = await db.query.staff.findFirst({ where: eq(staff.id, id) });
  if (!existingStaff) {
    return res.status(404).json({ status: 'error', message: 'Staff member not found' });
  }

  await db.update(staff)
    .set({ ...updateData, updatedAt: new Date().toISOString() })
    .where(eq(staff.id, id));

  // Sync with users table
  if (existingStaff.userId) {
    const userUpdate: any = {
      name: updateData.name || existingStaff.name,
      email: updateData.email || existingStaff.email,
      updatedAt: new Date().toISOString()
    };
    if (updateData.password) {
      userUpdate.password = updateData.password;
    }
    await db.update(users)
      .set(userUpdate)
      .where(eq(users.uid, existingStaff.userId));
  }

  res.status(200).json({ status: 'success', message: 'Staff updated successfully' });
});

export const deleteStaff = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  
  const staffMember = await db.query.staff.findFirst({ where: eq(staff.id, id) });
  if (!staffMember) {
    return res.status(404).json({ status: 'error', message: 'Staff member not found' });
  }

  // Delete user record as well
  if (staffMember.userId) {
    await db.delete(users).where(eq(users.uid, staffMember.userId));
  }

  await db.delete(staff).where(eq(staff.id, id));
  res.status(200).json({ status: 'success', message: 'Staff member deleted' });
});

export const assignClasses = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId, classIds } = req.body;

  // 1. Delete old assignments
  await db.delete(teacherClassAssignments).where(eq(teacherClassAssignments.teacherId, teacherId));

  // 2. Insert new ones
  if (classIds && classIds.length > 0) {
    const values = classIds.map((classId: string) => ({
      id: uuidv4(),
      teacherId,
      classId
    }));
    await db.insert(teacherClassAssignments).values(values);
  }

  res.status(200).json({ status: 'success', message: 'Classes assigned successfully' });
});

export const getTeacherClasses = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = getSingleValue(req.params.teacherId);

  const result = await db.query.teacherClassAssignments.findMany({
    where: eq(teacherClassAssignments.teacherId, teacherId),
    with: {
      class: {
        with: {
          students: true
        }
      }
    }
  });

  // Transform to match requested response format
  const transformed = result.map(a => ({
    classId: a.classId,
    className: `${a.class.name}-${a.class.section}`,
    students: a.class.students
  }));

  res.status(200).json({ status: 'success', data: transformed });
});

export const getTeacherDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const staffId = getSingleValue(req.params.staffId);
  const today = new Date().toISOString().split('T')[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[new Date().getDay()];

  // 1. Get Teacher Profile
  const teacher = await db.query.staff.findFirst({
    where: eq(staff.id, staffId)
  });

  if (!teacher) {
    return res.status(404).json({ status: 'error', message: 'Teacher profile not found' });
  }

  // 2. Get Assigned Classes
  const assignments = await db.query.teacherClassAssignments.findMany({
    where: eq(teacherClassAssignments.teacherId, staffId),
    with: {
      class: {
        with: {
          students: true
        }
      }
    }
  });

  const myClassIds = assignments.map(a => a.classId);
  const myClassNames = assignments.map(a => `${a.class.name}-${a.class.section}`.toLowerCase());

  // 3. Calculate Total Students
  const totalStudents = assignments.reduce((acc, curr) => acc + (curr.class.students?.length || 0), 0);

  // 4. Calculate Present Today
  let presentToday = 0;
  if (myClassIds.length > 0) {
    const todayAttendance = await db.query.attendance.findMany({
      where: and(
        inArray(attendance.classId, myClassIds),
        eq(attendance.date, today),
        eq(attendance.status, 'present')
      )
    });
    presentToday = todayAttendance.length;
  }

  // 5. Get Upcoming Exams (Filtered by Teacher's Classes)
  const allExams = await db.query.exams.findMany({
    where: eq(exams.schoolId, teacher.schoolId)
  });
  
  const myExams = allExams.filter(e => {
    if (!e.assignedClasses) return false;
    const examClassIds = e.assignedClasses.split(',').map(s => s.trim());
    return examClassIds.some(cid => myClassIds.includes(cid));
  });

  // 6. Get Today's Schedule from Timetable
  const timetableSlotsRes = await db.query.timetableSlots.findMany({
    where: and(
      eq(timetableSlots.teacherId, staffId),
      eq(timetableSlots.dayOfWeek, currentDay)
    ),
    with: {
      timetable: {
        with: {
          class: true
        }
      }
    }
  });

  const todaySchedule = timetableSlotsRes.map(slot => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    subject: slot.subject,
    classId: slot.timetable.classId,
    className: slot.timetable.class.name,
    section: slot.timetable.class.section,
    room: slot.roomId // This would ideally be mapped to room name
  })).sort((a, b) => a.startTime.localeCompare(b.startTime));

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalStudents,
        presentToday,
        examsCount: myExams.length,
        upcomingClasses: todaySchedule.length
      },
      todaySchedule,
      assignedClasses: assignments.map(a => ({
        classId: a.classId,
        className: `${a.class.name}-${a.class.section}`,
        students: a.class.students
      }))
    }
  });
});
