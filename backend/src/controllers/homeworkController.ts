import { Request, Response } from 'express';
import { db } from '../config/database';
import { homework, homeworkSubmissions, students, staff, classes } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

// TEACHER OPERATIONS

export const createHomework = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, classId, subject, title, description, dueDate, teacherId } = req.body;
  
  const id = uuidv4();
  const newHomework = {
    id,
    schoolId,
    classId,
    subject,
    title,
    description,
    dueDate,
    teacherId,
    createdAt: new Date().toISOString()
  };

  await db.insert(homework).values(newHomework);
  res.status(201).json({ status: 'success', data: newHomework });
});

export const getTeacherHomework = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = getSingleValue(req.params.teacherId);
  
  const result = await db.query.homework.findMany({
    where: eq(homework.teacherId, teacherId),
    with: {
      class: true
    },
    orderBy: [desc(homework.createdAt)]
  });
  
  res.status(200).json({ status: 'success', data: result });
});

export const updateHomework = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const data = req.body;
  
  await db.update(homework)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(homework.id, id));
    
  res.status(200).json({ status: 'success', message: 'Homework updated' });
});

export const deleteHomework = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(homework).where(eq(homework.id, id));
  res.status(200).json({ status: 'success', message: 'Homework deleted' });
});

export const getHomeworkSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const homeworkId = getSingleValue(req.params.homeworkId);
  
  const result = await db.query.homeworkSubmissions.findMany({
    where: eq(homeworkSubmissions.homeworkId, homeworkId),
    with: {
      student: true
    },
    orderBy: [desc(homeworkSubmissions.submittedAt)]
  });
  
  res.status(200).json({ status: 'success', data: result });
});

export const gradeHomework = asyncHandler(async (req: Request, res: Response) => {
  const submissionId = getSingleValue(req.params.submissionId);
  const { status, teacherFeedback } = req.body;
  
  await db.update(homeworkSubmissions)
    .set({ 
      status, 
      teacherFeedback,
      updatedAt: new Date().toISOString() 
    } as any)
    .where(eq(homeworkSubmissions.id, submissionId));
    
  res.status(200).json({ status: 'success', message: 'Homework graded' });
});

// STUDENT OPERATIONS

export const getStudentHomeworkList = asyncHandler(async (req: Request, res: Response) => {
  const classId = getSingleValue(req.params.classId);
  const studentId = getSingleValue(req.query.studentId);
  
  const homeworkList = await db.query.homework.findMany({
    where: eq(homework.classId, classId),
    orderBy: [desc(homework.createdAt)]
  });

  // Get submissions for these homeworks by this student
  const submissions = await db.query.homeworkSubmissions.findMany({
    where: and(
        inArray(homeworkSubmissions.homeworkId, homeworkList.length > 0 ? homeworkList.map(h => h.id) : ['none']),
        eq(homeworkSubmissions.studentId, studentId)
    )
  });

  const result = homeworkList.map(h => {
    const submission = submissions.find(s => s.homeworkId === h.id);
    return {
      ...h,
      submissionStatus: submission ? submission.status : 'pending',
      submissionDate: submission ? submission.submittedAt : null,
      feedback: submission ? submission.teacherFeedback : null,
      submissionId: submission ? submission.id : null
    };
  });
  
  res.status(200).json({ status: 'success', data: result });
});

export const submitHomework = asyncHandler(async (req: Request, res: Response) => {
  const { homeworkId, studentId, content, attachments } = req.body;
  
  const id = uuidv4();
  const newSubmission = {
    id,
    homeworkId,
    studentId,
    content,
    attachments, // JSON string
    status: 'submitted',
    submittedAt: new Date().toISOString()
  };

  await db.insert(homeworkSubmissions).values(newSubmission).onConflictDoUpdate({
      target: [homeworkSubmissions.homeworkId, homeworkSubmissions.studentId] as any,
      set: { ...newSubmission, submittedAt: new Date().toISOString() }
  });

  res.status(201).json({ status: 'success', data: newSubmission });
});
