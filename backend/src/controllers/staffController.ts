import { Request, Response } from 'express';
import { db } from '../config/database';
import { staff, users, teacherClassAssignments, classes, students, attendance, exams, timetableSlots, leaveRequests } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql, inArray, desc } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const getStaffBySchool = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.staff.findMany({
    where: eq(staff.schoolId, schoolId)
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getTeachersBySchool = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.staff.findMany({
    where: and(
      eq(staff.schoolId, schoolId),
      eq(staff.department, 'teaching')
    )
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

  const userRole = (role === 'Accountant' || role === 'Coach') ? role.toLowerCase() : 'staff';

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
    let userRole = undefined;
    if (updateData.role) {
      userRole = (updateData.role === 'Accountant' || updateData.role === 'Coach') ? updateData.role.toLowerCase() : 'staff';
    }

    const userUpdate: any = {
      name: updateData.name || existingStaff.name,
      email: updateData.email || existingStaff.email,
      updatedAt: new Date().toISOString()
    };

    if (userRole) {
      userUpdate.role = userRole;
    }
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
  const staffId = getSingleValue(req.params.teacherId);

  // 1. Get Teacher Profile
  const teacher = await db.query.staff.findFirst({
    where: eq(staff.id, staffId)
  });

  if (!teacher) {
    return res.status(404).json({ status: 'error', message: 'Teacher profile not found' });
  }

  // 2. Collect all associated Class IDs from multiple sources
  const assignments = await db.query.teacherClassAssignments.findMany({
    where: eq(teacherClassAssignments.teacherId, staffId),
  });
  const classIdsFromAssignments = assignments.map(a => a.classId);

  const timetableSlotsAll = await db.query.timetableSlots.findMany({
    where: eq(timetableSlots.teacherId, staffId),
    with: {
      timetable: true
    }
  });
  const classIdsFromTimetable = timetableSlotsAll.map(s => s.timetable?.classId).filter(Boolean);

  let classIdsFromStaffField: string[] = [];
  if (teacher.classes) {
    let legacyClasses: string[] = [];
    try {
      const parsed = JSON.parse(teacher.classes);
      if (Array.isArray(parsed)) legacyClasses = parsed;
    } catch (e) {
      legacyClasses = teacher.classes.split(',').map(s => s.trim()).filter(s => s);
    }
    
    // Map legacy class names to actual class IDs
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

  const myClassIds = Array.from(new Set([
    ...classIdsFromAssignments, 
    ...classIdsFromTimetable, 
    ...classIdsFromStaffField
  ]));

  // 3. Fetch full class details with students
  const myClasses = myClassIds.length > 0 ? await db.query.classes.findMany({
    where: inArray(classes.id, myClassIds),
    with: {
      students: true
    }
  }) : [];

  // Transform to match requested response format
  const transformed = myClasses.map(cls => ({
    classId: cls.id,
    className: `${cls.name}-${cls.section}`,
    students: cls.students
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

  // 2. Collect all associated Class IDs from multiple sources
  
  // A. From formal assignments
  const assignments = await db.query.teacherClassAssignments.findMany({
    where: eq(teacherClassAssignments.teacherId, staffId),
  });
  const classIdsFromAssignments = assignments.map(a => a.classId);

  // B. From timetable slots (The teacher might be in the timetable but not formally "assigned")
  const timetableSlotsAll = await db.query.timetableSlots.findMany({
    where: eq(timetableSlots.teacherId, staffId),
    with: {
      timetable: true
    }
  });
  const classIdsFromTimetable = timetableSlotsAll.map(s => s.timetable?.classId).filter(Boolean);

  // C. From staff.classes field (legacy or manual entry)
  let classIdsFromStaffField: string[] = [];
  if (teacher.classes) {
    let legacyClasses: string[] = [];
    try {
      const parsed = JSON.parse(teacher.classes);
      if (Array.isArray(parsed)) legacyClasses = parsed;
    } catch (e) {
      legacyClasses = teacher.classes.split(',').map(s => s.trim()).filter(s => s);
    }
    
    // Map legacy class names to actual class IDs
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

  // Unified unique Class IDs
  const myClassIds = Array.from(new Set([
    ...classIdsFromAssignments, 
    ...classIdsFromTimetable, 
    ...classIdsFromStaffField
  ]));

  // 3. Fetch all relevant Class details with Students
  const myClasses = myClassIds.length > 0 ? await db.query.classes.findMany({
    where: inArray(classes.id, myClassIds),
    with: {
      students: true
    }
  }) : [];

  // 4. Calculate Stats
  const totalStudents = myClasses.reduce((acc, curr) => acc + (curr.students?.length || 0), 0);

  // 5. Calculate Present Today
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

  // 6. Get Upcoming Exams
  const allExams = await db.query.exams.findMany({
    where: eq(exams.schoolId, teacher.schoolId)
  });
  
  const myExams = allExams.filter(e => {
    if (!e.assignedClasses) return false;
    const examClassIds = e.assignedClasses.split(',').map(s => s.trim());
    return examClassIds.some(cid => myClassIds.includes(cid));
  });

  // 7. Get Today's Schedule
  const timetableSlotsToday = await db.query.timetableSlots.findMany({
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

  const todaySchedule = timetableSlotsToday.map(slot => ({
    startTime: slot.startTime,
    endTime: slot.endTime,
    subject: slot.subject,
    classId: slot.timetable?.classId,
    className: slot.timetable?.class?.name || 'Unknown',
    section: slot.timetable?.class?.section || '',
    room: slot.roomId
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
      assignedClasses: myClasses.map(cls => ({
        classId: cls.id,
        className: `${cls.name}-${cls.section}`,
        students: cls.students
      }))
    }
  });
});


export const getLeavesByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const staffId = getSingleValue(req.params.staffId);
  
  const teacher = await db.query.staff.findFirst({ where: eq(staff.id, staffId) });
  if (!teacher) return res.status(404).json({ status: 'error', message: 'Teacher not found' });

  // Collect all associated Class IDs from multiple sources
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

  // Get students in these classes
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
  const { leaveId, status, teacherMessage, staffId } = req.body;

  await db.update(leaveRequests)
    .set({ 
      status, 
      teacherMessage, 
      approvedBy: staffId,
      updatedAt: new Date().toISOString() 
    } as any)
    .where(eq(leaveRequests.id, leaveId));

  res.status(200).json({ status: 'success', message: `Leave ${status} successfully` });
});
