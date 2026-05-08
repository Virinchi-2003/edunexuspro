import { Request, Response } from 'express';
import { db } from '../config/database';
import { feeStructures } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, not } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';
import { fees, feeInstallments, students } from '../db/schema';

export const getFeeStructures = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.feeStructures.findMany({
    where: eq(feeStructures.schoolId, schoolId),
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const { 
    schoolId, 
    grade, 
    amount, 
    tuitionFees,
    transportFees,
    libraryFees,
    examFees,
    activityFees,
    otherFees,
    description,
    installments 
  } = req.body;
  const id = uuidv4();

  const newFee = {
    id,
    schoolId,
    grade,
    amount: parseInt(amount) || 0,
    tuitionFees: parseInt(tuitionFees) || 0,
    transportFees: parseInt(transportFees) || 0,
    libraryFees: parseInt(libraryFees) || 0,
    examFees: parseInt(examFees) || 0,
    activityFees: parseInt(activityFees) || 0,
    otherFees: parseInt(otherFees) || 0,
    description,
    installments: installments ? (typeof installments === 'string' ? installments : JSON.stringify(installments)) : null,
  };

  await db.insert(feeStructures).values(newFee);

  // AUTO-ASSIGN: Assign this new structure to all students in this grade
  const gradeStudents = await db.query.students.findMany({
    where: and(
      eq(students.schoolId, schoolId),
      eq(students.grade, grade)
    )
  });

  if (gradeStudents.length > 0) {
    const instConfigs = installments ? (typeof installments === 'string' ? JSON.parse(installments) : installments) : [];
    
    for (const student of gradeStudents) {
      // Check if student already has an Academic Year Fee
      const existingFee = await db.query.fees.findFirst({
        where: and(
          eq(fees.studentId, student.id),
          eq(fees.feeType, 'Academic Year Fee')
        )
      });

      if (!existingFee) {
        const feeId = uuidv4();
        const timestamp = new Date().toISOString();
        
        // 1. Create main fee record
        await db.insert(fees).values({
          id: feeId,
          schoolId,
          studentId: student.id,
          amount: parseInt(amount) || 0,
          status: 'unpaid',
          feeType: 'Academic Year Fee',
          academicYear: '2026-27',
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        // 2. Create installments
        if (instConfigs.length > 0) {
          const newInstRecords = instConfigs.map((inst: any, idx: number) => ({
            id: uuidv4(),
            schoolId,
            studentId: student.id,
            feeRecordId: feeId,
            installmentNumber: idx + 1,
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: 'pending' as const,
          }));
          await db.insert(feeInstallments).values(newInstRecords);
        }
      }
    }
  }

  res.status(201).json({ status: 'success', message: 'Fee structure created and assigned to grade', data: newFee });
});

export const updateFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { 
    grade, 
    amount, 
    tuitionFees,
    transportFees,
    libraryFees,
    examFees,
    activityFees,
    otherFees,
    description,
    installments 
  } = req.body;

  const schoolId = getSingleValue(req.params.schoolId || req.body.schoolId);

  // 1. Update the Structure Template
  await db.update(feeStructures)
    .set({ 
      grade, 
      amount: parseInt(amount) || 0, 
      tuitionFees: parseInt(tuitionFees) || 0,
      transportFees: parseInt(transportFees) || 0,
      libraryFees: parseInt(libraryFees) || 0,
      examFees: parseInt(examFees) || 0,
      activityFees: parseInt(activityFees) || 0,
      otherFees: parseInt(otherFees) || 0,
      description,
      installments: installments ? (typeof installments === 'string' ? installments : JSON.stringify(installments)) : null,
      updatedAt: new Date().toISOString()
    })
    .where(eq(feeStructures.id, id));

  // 2. SYNC & AUTO-ASSIGN LOGIC
  // Find all students in this grade
  const gradeStudents = await db.query.students.findMany({
    where: and(
      eq(students.schoolId, schoolId),
      eq(students.grade, grade)
    )
  });

  if (gradeStudents.length > 0) {
    const instConfigs = installments ? (typeof installments === 'string' ? JSON.parse(installments) : installments) : [];
    
    for (const student of gradeStudents) {
      // Check if student already has an Academic Year Fee
      const feeRecord = await db.query.fees.findFirst({
        where: and(
          eq(fees.studentId, student.id),
          eq(fees.feeType, 'Academic Year Fee')
        )
      });

      if (!feeRecord) {
        // CASE: Student was not assigned yet -> Create new record + installments
        const feeId = uuidv4();
        const timestamp = new Date().toISOString();
        
        await db.insert(fees).values({
          id: feeId,
          schoolId,
          studentId: student.id,
          amount: parseInt(amount) || 0,
          status: 'unpaid',
          feeType: 'Academic Year Fee',
          academicYear: '2026-27',
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        if (instConfigs.length > 0) {
          const newInstRecords = instConfigs.map((inst: any, idx: number) => ({
            id: uuidv4(),
            schoolId,
            studentId: student.id,
            feeRecordId: feeId,
            installmentNumber: idx + 1,
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: 'pending' as const,
          }));
          await db.insert(feeInstallments).values(newInstRecords);
        }
      } else {
        // CASE: Student already assigned -> Sync existing unpaid installments
        // Update the main fee record amount if it changed
        await db.update(fees)
          .set({ amount: parseInt(amount) || 0 })
          .where(eq(fees.id, feeRecord.id));

        // Delete non-paid and non-verifying installments for this record
        await db.delete(feeInstallments).where(
          and(
            eq(feeInstallments.feeRecordId, feeRecord.id),
            not(eq(feeInstallments.status, 'paid')),
            not(eq(feeInstallments.status, 'pending_verification'))
          )
        );

        // Add new installments from the updated config
        if (instConfigs.length > 0) {
          const newInstRecords = instConfigs.map((inst: any, idx: number) => ({
            id: uuidv4(),
            schoolId,
            studentId: student.id,
            feeRecordId: feeRecord.id,
            installmentNumber: idx + 1,
            amount: inst.amount,
            dueDate: inst.dueDate,
            status: 'pending' as const,
          }));
          await db.insert(feeInstallments).values(newInstRecords);
        }
      }
    }
  }

  res.status(200).json({ status: 'success', message: 'Fee structure updated and synced with all students in grade' });
});

export const deleteFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(feeStructures).where(eq(feeStructures.id, id));
  res.status(200).json({ status: 'success', message: 'Fee structure deleted' });
});
