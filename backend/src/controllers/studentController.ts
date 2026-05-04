import { Request, Response } from 'express';
import { db } from '../config/database';
import { students, users, schools, homework, leaveRequests } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const getStudentsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.students.findMany({
    where: eq(students.schoolId, schoolId),
    orderBy: [desc(students.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createStudent = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, studentId, name, parentName, email, phone, password, grade, section, classId } = req.body;
  
  // 1. Check Plan Capacity
  const school = await db.query.schools.findFirst({ where: eq(schools.id, schoolId) });
  if (!school) {
    return res.status(404).json({ status: 'error', message: 'School not found' });
  }

  const [studentCount] = await db.select({ value: count() }).from(students).where(eq(students.schoolId, schoolId));
  const currentCount = studentCount?.value || 0;

  const planLimits: Record<string, number> = {
    'starter': 500,
    'growth': 2000,
    'pro': 5000,
    'elite': 1000000 
  };

  const limit = planLimits[school.subscriptionPlan.toLowerCase()] || 0;
  if (currentCount >= limit) {
    return res.status(403).json({ 
      status: 'error', 
      message: `Student capacity reached for ${school.subscriptionPlan} plan (${limit} students).` 
    });
  }

  const id = uuidv4();
  const userId = uuidv4();

  const studentData: any = {
    id,
    schoolId,
    studentId,
    name,
    parentName,
    email,
    phone,
    password: password || 'student123',
    grade,
    section,
    classId,
    userId,
    status: 'active' as const,
  };

  // 2. Insert/Update Student
  await db.insert(students).values(studentData).onConflictDoUpdate({
    target: students.studentId,
    set: { ...studentData, updatedAt: new Date().toISOString() }
  });

  // 3. Insert/Update User Record
  await db.insert(users).values({
    uid: userId,
    email: email || `${studentId}@school.com`,
    password: password || 'student123',
    name,
    role: 'student',
    schoolId,
    status: 'active'
  }).onConflictDoUpdate({
    target: users.email,
    set: { 
      name, 
      password: password || 'student123',
      schoolId,
      updatedAt: new Date().toISOString()
    }
  });

  res.status(201).json({ status: 'success', data: studentData });
});

export const bulkCreateStudents = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, students: studentList } = req.body;
  
  if (!Array.isArray(studentList)) {
    return res.status(400).json({ status: 'error', message: 'Students list must be an array' });
  }

  // 1. Check Plan Capacity
  const school = await db.query.schools.findFirst({ where: eq(schools.id, schoolId) });
  if (!school) {
    return res.status(404).json({ status: 'error', message: 'School not found' });
  }

  const [studentCount] = await db.select({ value: sql`count(*)` }).from(students).where(eq(students.schoolId, schoolId));
  const currentCount = Number((studentCount as any).value || 0);

  const planLimits: Record<string, number> = {
    'starter': 500,
    'growth': 2000,
    'pro': 5000,
    'elite': 1000000
  };

  const limit = planLimits[school.subscriptionPlan.toLowerCase()] || 0;
  const remainingCapacity = limit - currentCount;

  if (remainingCapacity <= 0) {
    return res.status(403).json({ 
      status: 'error', 
      message: `Capacity reached for ${school.subscriptionPlan} plan. Upgrade to add more students.` 
    });
  }

  // Only import up to the remaining capacity
  const toImport = studentList.slice(0, remainingCapacity);
  const skippedCount = studentList.length - toImport.length;

  const results = [];
  for (const rawS of toImport) {
    // Normalize keys to lowercase for easier matching
    const s: any = {};
    Object.keys(rawS).forEach(key => {
      s[key.toLowerCase().replace(/\s/g, '')] = rawS[key];
    });

    const id = uuidv4();
    const userId = uuidv4();
    const student_id = String(s.studentid || s.rollnumber || s.id || `STU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
    
    const studentData = {
      id,
      schoolId,
      studentId: student_id,
      name: String(s.name || s.studentname || 'Unknown Student'),
      parentName: String(s.parentname || s.fathername || s.guardianname || ''),
      email: s.email || s.mail || null,
      phone: String(s.phone || s.mobile || s.mobilenumber || ''),
      password: String(s.password || 'student123'),
      grade: String(s.grade || s.class || 'N/A'),
      section: String(s.section || ''),
      userId,
      status: 'active' as const,
    };
    
    // Insert into students with conflict handling
    await db.insert(students).values(studentData).onConflictDoUpdate({
      target: students.studentId,
      set: { ...studentData, updatedAt: new Date().toISOString() }
    });
    
    // Insert/Update user record
    await db.insert(users).values({
      uid: userId,
      email: studentData.email || `${student_id}@school.com`,
      password: studentData.password,
      name: studentData.name,
      role: 'student',
      schoolId,
      status: 'active'
    }).onConflictDoUpdate({
      target: users.email,
      set: { 
        password: studentData.password,
        name: studentData.name,
        updatedAt: new Date().toISOString()
      }
    });
    
    results.push(studentData);
  }

  res.status(201).json({ 
    status: 'success', 
    message: `Imported/Updated ${results.length} students.${skippedCount > 0 ? ` Skipped ${skippedCount} students due to plan limit.` : ''}`, 
    data: results 
  });
});

export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const data = req.body;

  await db.update(students)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(students.id, id));

  // If email or password changed, update user record
  const student = await db.query.students.findFirst({ where: eq(students.id, id) });
  if (student?.userId) {
    await db.update(users)
      .set({ 
        email: student.email || undefined,
        password: student.password || undefined,
        name: student.name,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.uid, student.userId));
  }

  res.status(200).json({ status: 'success', message: 'Student updated successfully' });
});

export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const student = await db.query.students.findFirst({ where: eq(students.id, id) });
  
  if (student?.userId) {
    await db.delete(users).where(eq(users.uid, student.userId));
  }
  
  await db.delete(students).where(eq(students.id, id));
  res.status(200).json({ status: 'success', message: 'Student deleted successfully' });
});

export const getStudentByUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = getSingleValue(req.params.userId);
  const result = await db.query.students.findFirst({
    where: eq(students.userId, userId)
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getStudentsByClass = asyncHandler(async (req: Request, res: Response) => {
  const classId = getSingleValue(req.params.classId);
  const result = await db.query.students.findMany({
    where: eq(students.classId, classId),
    orderBy: [desc(students.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getStudentsByMultipleClasses = asyncHandler(async (req: Request, res: Response) => {
  const { classIds } = req.body;
  if (!Array.isArray(classIds) || classIds.length === 0) {
    return res.status(200).json({ status: 'success', data: [] });
  }
  
  const result = await db.query.students.findMany({
    where: sql`${students.classId} IN (${sql.join(classIds.map(id => sql`${id}`), sql`, `)})`,
    orderBy: [desc(students.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getStudentHomework = asyncHandler(async (req: Request, res: Response) => {
  const classId = getSingleValue(req.params.classId);
  const result = await db.query.homework.findMany({
    where: eq(homework.classId, classId),
    orderBy: [desc(homework.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getStudentLeaves = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const result = await db.query.leaveRequests.findMany({
    where: eq(leaveRequests.studentId, studentId),
    orderBy: [desc(leaveRequests.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const applyLeave = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, studentId, reason, startDate, endDate } = req.body;
  const id = uuidv4();
  const newLeave = { id, schoolId, studentId, reason, startDate, endDate, status: 'pending' };
  await db.insert(leaveRequests).values(newLeave);
  res.status(201).json({ status: 'success', data: newLeave });
});
export const getStudentQR = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const { generateStudentQRToken, generateQRCodeDataURL } = await import('../services/qrService');

  // Verify student exists
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId)
  });

  if (!student) {
    return res.status(404).json({ status: 'error', message: 'Student not found' });
  }

  // Generate secure token (JWT)
  const token = generateStudentQRToken(student.id);
  
  // Generate QR Image (Base64)
  const qrCodeDataURL = await generateQRCodeDataURL(token);

  res.status(200).json({
    status: 'success',
    data: {
      studentId: student.id,
      name: student.name,
      qrCode: qrCodeDataURL,
      token
    }
  });
});
