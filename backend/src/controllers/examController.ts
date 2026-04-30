import { Request, Response } from 'express';
import { db } from '../config/database';
import { exams, examSchedule, marks, students, classes } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';
import { generateReportCardPDF, generateBatchReportPDF, generateHallTicketPDF, generateExamSchedulePDF, generateGradebookPDF } from '../utils/pdfGenerator';

export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, name, term, startDate, endDate, assignedClasses } = req.body;
  const id = uuidv4();
  const newExam = { id, schoolId, name, term, startDate, endDate, assignedClasses };
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
  const { records } = req.body;
  
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ status: 'error', message: 'Invalid records' });
  }

  const results = [];
  for (const record of records) {
    const { studentId, marksObtained, comments, examId, subject } = record;
    
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

const calculateGrade = (obtained: number | null, total: number | null) => {
  if (obtained === null || !total) return '--';
  const percentage = (obtained / total) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

export const downloadClassReportCards = asyncHandler(async (req: Request, res: Response) => {
  const classId = getSingleValue(req.params.classId);
  const examId = getSingleValue(req.query.examId as string);

  if (!classId || !examId) {
    return res.status(400).json({ status: 'error', message: 'Missing classId or examId' });
  }

  const cls = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
  if (!cls) return res.status(404).json({ status: 'error', message: 'Class not found' });

  const classStudents = await db.query.students.findMany({
    where: (students, { eq, and, or }) => or(
      eq(students.classId, classId),
      and(
        eq(students.grade, cls.name),
        eq(students.section, cls.section)
      )
    )
  });

  const examInfo = await db.query.exams.findFirst({ where: eq(exams.id, examId) });

  const batchReportData = [];
  for (const student of classStudents) {
    const studentMarks = await db.query.marks.findMany({
      where: eq(marks.studentId, student.id),
      with: {
        examSchedule: true
      }
    });

    const filteredMarks = studentMarks.filter(m => m.examSchedule?.examId === examId);

    batchReportData.push({
      studentName: student.name,
      studentId: student.studentId,
      grade: `${cls.name}-${cls.section}`,
      term: examInfo?.name || 'Academic Term',
      marks: filteredMarks.map(m => ({
        subject: m.examSchedule?.subject || 'N/A',
        marksObtained: m.marksObtained,
        totalMarks: m.totalMarks || 100,
        grade: calculateGrade(m.marksObtained, m.totalMarks || 100)
      })),
      attendance: 98,
      remarks: 'Consolidated report generated for class.'
    });
  }

  if (batchReportData.length === 0) {
    return res.status(404).json({ status: 'error', message: 'No records found for this class' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=BatchReport_${cls.name}_${cls.section}.pdf`);
  generateBatchReportPDF(batchReportData, res);
});

export const downloadHallTickets = asyncHandler(async (req: Request, res: Response) => {
  const examId = getSingleValue(req.params.examId);
  const schoolId = getSingleValue(req.query.schoolId as string);

  if (!examId || !schoolId) {
    return res.status(400).json({ status: 'error', message: 'Missing examId or schoolId' });
  }

  const exam = await db.query.exams.findFirst({ where: eq(exams.id, examId) });
  const schedules = await db.query.examSchedule.findMany({
    where: eq(examSchedule.examId, examId)
  });

  if (!exam) return res.status(404).json({ status: 'error', message: 'Exam not found' });

  const allStudents = await db.query.students.findMany({
    where: eq(students.schoolId, schoolId),
    with: {
      class: true
    }
  });

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

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=HallTickets_${exam.name}.pdf`);
  generateHallTicketPDF(hallTicketData, res);
});

export const downloadReportCard = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const term = getSingleValue(req.query.term as string);

  const student = await db.query.students.findFirst({ 
    where: eq(students.id, studentId),
    with: {
      class: true
    }
  });
  
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
    grade: student.class ? `${student.class.name}-${student.class.section}` : student.grade,
    term: term || 'Final Term',
    marks: studentMarks.map(m => ({
      subject: m.examSchedule?.subject || 'N/A',
      marksObtained: m.marksObtained,
      totalMarks: m.totalMarks || 100,
      grade: calculateGrade(m.marksObtained, m.totalMarks || 100)
    })),
    attendance: 95
  };

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=ReportCard_${student.studentId}.pdf`);
  generateReportCardPDF(reportData, res);
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

export const downloadExamSchedule = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const exam = await db.query.exams.findFirst({
    where: eq(exams.id, id),
    with: {
      schedules: true
    }
  });

  if (!exam) return res.status(404).json({ status: 'error', message: 'Exam not found' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Schedule_${exam.name.replace(/\s+/g, '_')}.pdf`);
  generateExamSchedulePDF(exam, res);
});

export const getExamMarks = asyncHandler(async (req: Request, res: Response) => {
  const examId = getSingleValue(req.query.examId as string);
  const classId = getSingleValue(req.query.classId as string);
  const subject = getSingleValue(req.query.subject as string);
  
  if (!examId || !classId || !subject) {
    return res.status(400).json({ status: 'error', message: 'Missing parameters' });
  }

  const schedule = await db.query.examSchedule.findFirst({
    where: and(
      eq(examSchedule.examId, examId),
      eq(examSchedule.subject, subject)
    )
  });

  if (!schedule) {
    return res.status(200).json({ status: 'success', data: [] });
  }

  const studentMarks = await db.query.marks.findMany({
    where: eq(marks.examScheduleId, schedule.id),
    with: {
      student: true
    }
  });

  const cls = await db.query.classes.findFirst({ where: eq(classes.id, classId) });

  // Filter marks only for the students in the selected class
  const filteredMarks = studentMarks.filter(m => 
    m.student?.classId === classId || 
    (cls && m.student?.grade === cls.name && m.student?.section === cls.section)
  );

  res.status(200).json({ status: 'success', data: filteredMarks });
});

export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const data = req.body;
  await db.update(exams).set(data).where(eq(exams.id, id));
  res.status(200).json({ status: 'success', message: 'Exam updated' });
});

export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(exams).where(eq(exams.id, id));
  res.status(200).json({ status: 'success', message: 'Exam deleted' });
});

export const downloadGradebook = asyncHandler(async (req: Request, res: Response) => {
  const examId = getSingleValue(req.query.examId as string);
  const classId = getSingleValue(req.query.classId as string);
  const subject = getSingleValue(req.query.subject as string);

  if (!examId || !classId || !subject) {
    return res.status(400).json({ status: 'error', message: 'Missing parameters' });
  }

  const examInfo = await db.query.exams.findFirst({ where: eq(exams.id, examId) });
  const cls = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
  const schedule = await db.query.examSchedule.findFirst({
    where: and(
      eq(examSchedule.examId, examId),
      eq(examSchedule.subject, subject)
    )
  });

  if (!examInfo || !cls || !schedule) {
    return res.status(404).json({ status: 'error', message: 'Exam, Class or Subject not found' });
  }

  const studentMarks = await db.query.marks.findMany({
    where: eq(marks.examScheduleId, schedule.id),
    with: {
      student: true
    }
  });

  const filteredMarks = studentMarks.filter(m => 
    m.student?.classId === classId || 
    (cls && m.student?.grade === cls.name && m.student?.section === cls.section)
  );

  const gradebookData = {
    examName: examInfo.name,
    term: examInfo.term || 'N/A',
    className: `${cls.name}-${cls.section}`,
    subject: subject,
    totalMarks: schedule.totalMarks || 100,
    records: filteredMarks.map(m => ({
      studentName: m.student?.name || 'Unknown',
      studentId: m.student?.studentId || 'N/A',
      marksObtained: m.marksObtained,
      grade: calculateGrade(m.marksObtained, schedule.totalMarks || 100),
      comments: m.comments || '-'
    }))
  };

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Gradebook_${cls.name}_${subject}.pdf`);
  generateGradebookPDF(gradebookData, res);
});
