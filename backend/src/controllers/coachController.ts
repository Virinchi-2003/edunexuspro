import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  sports, 
  sportsEnrollments, 
  skillAssessments, 
  trainingLogs, 
  fixtures, 
  medicalRecords, 
  inventory, 
  inventoryTransactions,
  students,
  staff,
  schools,
  attendance
} from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

// --- Sports & Enrollments ---
export const getSports = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.sports.findMany({
    where: eq(sports.schoolId, schoolId),
    with: {
      coach: true
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getEnrolledStudents = asyncHandler(async (req: Request, res: Response) => {
  const sportId = getSingleValue(req.params.sportId);
  const result = await db.query.sportsEnrollments.findMany({
    where: eq(sportsEnrollments.sportId, sportId),
    with: {
      student: true
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

// --- Clipboard: Assessments & Logs ---
export const createSkillAssessment = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, studentId, sportId, skill, score, comments, assessedBy } = req.body;
  const id = uuidv4();
  const newAssessment = { id, schoolId, studentId, sportId, skill, score, comments, assessedBy };
  await db.insert(skillAssessments).values(newAssessment);
  res.status(201).json({ status: 'success', data: newAssessment });
});

export const getStudentSkillHistory = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const result = await db.query.skillAssessments.findMany({
    where: eq(skillAssessments.studentId, studentId),
    orderBy: [desc(skillAssessments.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const createTrainingLog = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, sportId, duration, intensity, notes, date } = req.body;
  const loadScore = (duration * intensity) / 10;
  const id = uuidv4();
  const log = { id, studentId, sportId, duration, intensity, loadScore, notes, date };
  await db.insert(trainingLogs).values(log);
  res.status(201).json({ status: 'success', data: log });
});

// --- Fixtures ---
export const getFixtures = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.fixtures.findMany({
    where: eq(fixtures.schoolId, schoolId),
    orderBy: [desc(fixtures.dateTime)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const updateFixtureResult = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { score, result, status } = req.body;
  await db.update(fixtures)
    .set({ score, result, status: status || 'completed', updatedAt: new Date().toISOString() })
    .where(eq(fixtures.id, id));
  res.status(200).json({ status: 'success', message: 'Fixture updated' });
});

// --- Medical & Fitness ---
export const getStudentMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  let record = await db.query.medicalRecords.findFirst({
    where: eq(medicalRecords.studentId, studentId)
  });
  
  if (!record) {
    const id = uuidv4();
    const newRecord = { 
      id, 
      studentId, 
      bmi: 0, 
      staminaScore: 0, 
      sprintTime: 0, 
      medicalFlags: '[]', 
      medications: '', 
      emergencyContact: '', 
      wearableData: '{}',
      updatedAt: new Date().toISOString() 
    };
    await db.insert(medicalRecords).values(newRecord);
    record = newRecord as any;
  }
  
  res.status(200).json({ status: 'success', data: record });
});

export const updateMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const data = req.body;
  await db.update(medicalRecords)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(medicalRecords.studentId, studentId));
  res.status(200).json({ status: 'success', message: 'Medical record updated' });
});

// --- Inventory ---
export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.inventory.findMany({
    where: eq(inventory.schoolId, schoolId)
  });
  res.status(200).json({ status: 'success', data: result });
});

export const inventoryCheckout = asyncHandler(async (req: Request, res: Response) => {
  const { inventoryId, studentId, quantity, signature } = req.body;
  const item = await db.query.inventory.findFirst({ where: eq(inventory.id, inventoryId) });
  
  if (!item || item.availableQuantity < quantity) {
    return res.status(400).json({ status: 'error', message: 'Insufficient stock' });
  }

  const id = uuidv4();
  await db.insert(inventoryTransactions).values({
    id, inventoryId, studentId, type: 'checkout', quantity, signature, status: 'active'
  });

  await db.update(inventory)
    .set({ availableQuantity: item.availableQuantity - quantity })
    .where(eq(inventory.id, inventoryId));

  res.status(201).json({ status: 'success', message: 'Item checked out' });
});

export const inventoryCheckin = asyncHandler(async (req: Request, res: Response) => {
  const { transactionId, status, fineAmount } = req.body;
  const transaction = await db.query.inventoryTransactions.findFirst({ where: eq(inventoryTransactions.id, transactionId) });
  
  if (!transaction) return res.status(404).json({ status: 'error', message: 'Transaction not found' });

  await db.update(inventoryTransactions)
    .set({ status: status || 'returned', fineAmount: fineAmount || 0 })
    .where(eq(inventoryTransactions.id, transactionId));

  const item = await db.query.inventory.findFirst({ where: eq(inventory.id, transaction.inventoryId) });
  if (item && status !== 'lost') {
    await db.update(inventory)
      .set({ availableQuantity: item.availableQuantity + transaction.quantity })
      .where(eq(inventory.id, item.id));
  }

  res.status(200).json({ status: 'success', message: 'Item checked in' });
});
