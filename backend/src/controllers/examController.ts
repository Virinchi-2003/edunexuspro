import { Request, Response } from 'express';
import { db } from '../config/database';
import { exams, examSchedule, marks, students, gradingRules } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, name, term, startDate, endDate } = req.body;
  const id = uuidv4();
  const newExam = { id, schoolId, name, term, startDate, endDate };
  await db.insert(exams).values(newExam);
  res.status(201).json({ status: 'success', data: newExam });
});

export const getExams = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.exams.findMany({
    where: eq(exams.schoolId, schoolId),
    with: {
      schedules: true
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

export const addExamSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { examId, subject, date, startTime, endTime, roomId, totalMarks } = req.body;
  const id = uuidv4();
  const newSchedule = { id, examId, subject, date, startTime, endTime: endTime || startTime, roomId, totalMarks };
  await db.insert(examSchedule).values(newSchedule);
  res.status(201).json({ status: 'success', data: newSchedule });
});

export const removeExamSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(examSchedule).where(eq(examSchedule.id, id));
  res.status(200).json({ status: 'success', message: 'Schedule removed' });
});

export const enterMarks = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, records } = req.body;
  
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ status: 'error', message: 'Invalid records' });
  }

  const results = [];
  for (const record of records) {
    const { studentId, marksObtained, comments, examId, subject } = record;
    
    // Find schedule for this exam/subject
    const schedule = await db.query.examSchedule.findFirst({
      where: and(
        eq(examSchedule.examId, examId),
        eq(examSchedule.subject, subject)
      )
    });

    if (!schedule) continue;

    const id = uuidv4();
    const markData = {
      id,
      examScheduleId: schedule.id,
      studentId,
      marksObtained,
      totalMarks: schedule.totalMarks,
      comments,
      updatedAt: new Date().toISOString()
    };

    // Simple check and insert/update
    const existing = await db.query.marks.findFirst({
      where: and(
        eq(marks.examScheduleId, schedule.id),
        eq(marks.studentId, studentId)
      )
    });

    if (existing) {
      await db.update(marks).set({
        marksObtained,
        comments,
        updatedAt: new Date().toISOString()
      }).where(eq(marks.id, existing.id));
    } else {
      await db.insert(marks).values(markData);
    }
    results.push(markData);
  }

  res.status(200).json({ status: 'success', data: results });
});

export const downloadClassReportCards = asyncHandler(async (req: Request, res: Response) => {
  const classId = getSingleValue(req.params.classId);
  const examId = getSingleValue(req.query.examId as string);

  if (!classId || !examId) {
    return res.status(400).json({ status: 'error', message: 'Missing classId or examId' });
  }

  // 1. Fetch Class and Students
  const cls = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
  if (!cls) return res.status(404).json({ status: 'error', message: 'Class not found' });

  // Get students in this class
  const classStudents = await db.query.students.findMany({
    where: eq(students.classId, classId)
  });

  // 2. Fetch Exam details
  const examInfo = await db.query.exams.findFirst({ where: eq(exams.id, examId) });

  // 3. Prepare Batch Data
  const batchReportData = [];
  for (const student of classStudents) {
    const studentMarks = await db.query.marks.findMany({
      where: eq(marks.studentId, student.id),
      with: {
        examSchedule: {
          where: eq(examSchedule.examId, examId)
        }
      }
    });

    const filteredMarks = studentMarks.filter(m => m.examSchedule !== null);

    batchReportData.push({
      studentName: student.name,
      studentId: student.studentId,
      grade: `${cls.name}-${cls.section}`,
      term: examInfo?.name || 'Academic Term',
      marks: filteredMarks.map(m => ({
        subject: m.examSchedule?.subject || 'N/A',
        marksObtained: m.marksObtained,
        totalMarks: m.totalMarks,
        grade: calculateGrade(m.marksObtained, m.totalMarks)
      })),
      attendance: 98, // Mock
      remarks: 'Consolidated report generated for class.'
    });
  }

  if (batchReportData.length === 0) {
    return res.status(404).json({ status: 'error', message: 'No records found for this class' });
  }

  // 4. Generate PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=BatchReport_${cls.name}_${cls.section}.pdf`);
  
  generateBatchReportPDF(batchReportData, res);
});

const calculateGrade = (obtained: number | null, total: number | null) => {
  if (!obtained || !total) return '--';
  const percentage = (obtained / total) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

export const downloadHallTickets = asyncHandler(async (req: Request, res: Response) => {
  const examId = getSingleValue(req.params.examId);
  const schoolId = getSingleValue(req.query.schoolId as string);

  if (!examId || !schoolId) {
    return res.status(400).json({ status: 'error', message: 'Missing examId or schoolId' });
  }

  // 1. Fetch Exam and Schedule
  const exam = await db.query.exams.findFirst({ where: eq(exams.id, examId) });
  const schedules = await db.query.examSchedule.findMany({
    where: eq(examSchedule.examId, examId)
  });

  if (!exam) return res.status(404).json({ status: 'error', message: 'Exam not found' });

  // 2. Fetch all students for this school (or class if filtered)
  const allStudents = await db.query.students.findMany({
    where: eq(students.schoolId, schoolId),
    with: {
      class: true
    }
  });

  // 3. Prepare Data for PDF
  const hallTicketData = allStudents.map(student => ({
    studentName: student.name,
    studentId: student.studentId,
    className: student.class ? `${student.class.name}-${student.class.section}` : 'N/A',
    examName: exam.name,
    term: exam.term,
    schedules: schedules.map(s => ({
      subject: s.subject,
      date: s.date,
      time: s.startTime
    }))
  }));

  if (hallTicketData.length === 0) {
    return res.status(404).json({ status: 'error', message: 'No students found to generate tickets' });
  }

  // 4. Generate PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=HallTickets_${exam.name}.pdf`);
  
  generateHallTicketPDF(hallTicketData, res);
});

export const getStudentPerformance = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const result = await db.query.marks.findMany({
    where: eq(marks.studentId, studentId),
    with: {
      examSchedule: {
        with: {
          exam: true
        }
      }
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

import { generateReportCardPDF, generateBatchReportPDF, generateHallTicketPDF } from '../utils/pdfGenerator';
import { classes } from '../db/schema';

export const downloadReportCard = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const term = getSingleValue(req.query.term as string);

  // Fetch all necessary data
  const student = await db.query.students.findFirst({ where: eq(students.id, studentId) });
  const studentMarks = await db.query.marks.findMany({
    where: eq(marks.studentId, studentId),
    with: {
      examSchedule: true
    }
  });

  if (!student) return res.status(404).json({ status: 'error', message: 'Student not found' });

  const reportData = {
    studentName: student.name,
    studentId: student.studentId,
    grade: student.grade,
    term: term || 'Final Term',
    marks: studentMarks.map(m => ({
      subject: m.examSchedule?.subject || 'N/A',
      marksObtained: m.marksObtained,
      totalMarks: m.totalMarks,
      grade: calculateGrade(m.marksObtained, m.totalMarks)
    })),
    attendance: 95 // Mock attendance
  };

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=ReportCard_${student.studentId}.pdf`);
  
  generateReportCardPDF(reportData, res);
});
