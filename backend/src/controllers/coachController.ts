import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  students, 
  sports, 
  sportsEnrollments, 
  fixtures, 
  inventory, 
  inventoryTransactions, 
  skillAssessments, 
  medicalRecords, 
  trainingLogs,
  trophies,
  requisitions
} from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import asyncHandler from 'express-async-handler';

const getSingleValue = (val: string | string[] | undefined): string => {
  return Array.isArray(val) ? val[0] : (val || '');
};

// --- Student & Enrollment ---
export const getEnrolledStudents = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.sportsEnrollments.findMany({
    with: {
      student: true,
      sport: true
    },
    where: (enrollments, { exists }) => exists(
      db.select().from(sports).where(and(eq(sports.id, enrollments.sportId), eq(sports.schoolId, schoolId)))
    )
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getSportsStudents = asyncHandler(async (req: Request, res: Response) => {
  const sportId = getSingleValue(req.params.sportId);
  const schoolId = getSingleValue(req.params.schoolId);
  
  const result = await db.query.sportsEnrollments.findMany({
    where: (enrollments, { exists }) => and(
      eq(enrollments.sportId, sportId),
      exists(
        db.select().from(sports).where(and(eq(sports.id, enrollments.sportId), eq(sports.schoolId, schoolId)))
      )
    ),
    with: {
      student: true,
      sport: true
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getSchoolStudents = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.select().from(students).where(eq(students.schoolId, schoolId));
  res.status(200).json({ status: 'success', data: result });
});

export const addSportsStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const { name, studentId, grade, section, sportId, schoolId } = req.body;
  
  const [newStudent] = await db.insert(students).values({
    id, schoolId, name, studentId, grade, section, status: 'active', password: 'password123'
  }).returning();

  let effectiveSportId = sportId;
  if (req.body.manualSportName && schoolId) {
    effectiveSportId = uuidv4();
    await db.insert(sports).values({ id: effectiveSportId, schoolId, name: req.body.manualSportName });
  }

  if (effectiveSportId) {
    const enrollmentId = uuidv4();
    await db.insert(sportsEnrollments).values({
      id: enrollmentId,
      studentId: id,
      sportId: effectiveSportId
    });
  }
  
  res.status(201).json({ status: 'success', data: newStudent });
});

export const enrollExistingStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, sportId, manualSportName, schoolId } = req.body;
  
  let effectiveSportId = sportId;
  if (manualSportName && schoolId) {
    effectiveSportId = uuidv4();
    await db.insert(sports).values({ id: effectiveSportId, schoolId, name: manualSportName });
  }

  const enrollmentId = uuidv4();
  await db.insert(sportsEnrollments).values({
    id: enrollmentId,
    studentId,
    sportId: effectiveSportId
  });
  
  res.status(201).json({ status: 'success', message: 'Student enrolled in sport' });
});

export const unenrollStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId, sportId } = req.params;
  await db.delete(sportsEnrollments).where(and(eq(sportsEnrollments.studentId, studentId), eq(sportsEnrollments.sportId, sportId)));
  res.status(200).json({ status: 'success', message: 'Student unenrolled' });
});

export const updateSportsStudent = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const data = req.body;
  await db.update(students).set(data).where(eq(students.id, id));
  res.status(200).json({ status: 'success', message: 'Student updated' });
});

// --- Sports Programs ---
export const getSports = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.select().from(sports).where(eq(sports.schoolId, schoolId));
  res.status(200).json({ status: 'success', data: result });
});

export const addSport = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const data = req.body;
  await db.insert(sports).values({ id, ...data });
  res.status(201).json({ status: 'success', message: 'Sport added' });
});

export const updateSport = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const data = req.body;
  await db.update(sports).set(data).where(eq(sports.id, id));
  res.status(200).json({ status: 'success', message: 'Sport updated' });
});

export const deleteSport = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(sports).where(eq(sports.id, id));
  res.status(200).json({ status: 'success', message: 'Sport deleted' });
});

// --- Dashboard Stats ---
export const getCoachDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  
  const [sportsCount, fixturesCount, inventoryAlerts, medicalCount] = await Promise.all([
    db.select({ count: sql`count(*)` })
      .from(sportsEnrollments)
      .innerJoin(sports, eq(sportsEnrollments.sportId, sports.id))
      .where(eq(sports.schoolId, schoolId)),
    db.select({ count: sql`count(*)` })
      .from(fixtures)
      .where(and(eq(fixtures.schoolId, schoolId), eq(fixtures.status, 'scheduled'))),
    db.select()
      .from(inventory)
      .where(and(eq(inventory.schoolId, schoolId), sql`${inventory.availableQuantity} < ${inventory.lowStockAlert}`)),
    db.select({ count: sql`count(*)` })
      .from(medicalRecords)
      .innerJoin(students, eq(medicalRecords.studentId, students.id))
      .where(and(eq(students.schoolId, schoolId), sql`json_array_length(${medicalRecords.medicalFlags}) > 0`))
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      activePlayers: Number(sportsCount[0]?.count || 0),
      upcomingMatches: Number(fixturesCount[0]?.count || 0),
      inventoryAlerts: inventoryAlerts.length,
      medicalFlags: Number(medicalCount[0]?.count || 0)
    }
  });
});

// --- Analytics ---
export const getRecentAssessments = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.skillAssessments.findMany({
    where: eq(skillAssessments.schoolId, schoolId),
    with: {
      student: true,
      sport: true
    },
    limit: 5,
    orderBy: [desc(skillAssessments.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const getTrainingLoadAnalysis = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const logs = await db.query.trainingLogs.findMany({
    with: {
      student: true,
      sport: true
    },
    where: (logs, { exists }) => exists(
      db.select().from(students).where(and(eq(students.id, logs.studentId), eq(students.schoolId, schoolId)))
    ),
    limit: 50
  });

  const totalIntensity = logs.reduce((acc, log) => acc + log.intensity, 0);
  const avgIntensity = logs.length > 0 ? (totalIntensity / logs.length).toFixed(1) : 0;
  
  const flaggedStudents = logs
    .filter(log => (log.loadScore || 0) > 8)
    .map(log => ({
      name: log.student.name,
      reason: 'High intensity session',
      score: log.loadScore
    }));

  res.status(200).json({
    status: 'success',
    data: {
      avgIntensity,
      flaggedCount: flaggedStudents.length,
      flaggedStudents: flaggedStudents.slice(0, 3)
    }
  });
});

export const addTrainingLog = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const data = req.body;
  await db.insert(trainingLogs).values({ id, ...data });
  res.status(201).json({ status: 'success', message: 'Training log saved' });
});

// --- Fixtures & Results ---
export const getFixtures = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.fixtures.findMany({
    where: eq(fixtures.schoolId, schoolId),
    with: { sport: true },
    orderBy: [desc(fixtures.dateTime)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const addFixture = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const data = req.body;
  await db.insert(fixtures).values({ id, ...data });
  res.status(201).json({ status: 'success', message: 'Fixture scheduled' });
});

export const updateFixture = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const data = req.body;
  await db.update(fixtures).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(fixtures.id, id));
  res.status(200).json({ status: 'success', message: 'Fixture updated' });
});

export const deleteFixture = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(fixtures).where(eq(fixtures.id, id));
  res.status(200).json({ status: 'success', message: 'Fixture deleted' });
});

// --- Trophy Gallery ---
export const getTrophies = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.trophies.findMany({
    where: eq(trophies.schoolId, schoolId),
    with: { sport: true },
    orderBy: [desc(trophies.year)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const addTrophy = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const data = req.body;
  await db.insert(trophies).values({ id, ...data });
  res.status(201).json({ status: 'success', message: 'Achievement archived in gallery' });
});

export const deleteTrophy = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(trophies).where(eq(trophies.id, id));
  res.status(200).json({ status: 'success', message: 'Trophy removed from gallery' });
});

// --- Inventory ---
export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.select().from(inventory).where(eq(inventory.schoolId, schoolId));
  res.status(200).json({ status: 'success', data: result });
});

export const addInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const { totalQuantity, ...rest } = req.body;
  await db.insert(inventory).values({ 
    id, 
    totalQuantity, 
    availableQuantity: totalQuantity, 
    ...rest 
  });
  res.status(201).json({ status: 'success', message: 'Inventory item added' });
});

export const updateInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const data = req.body;
  await db.update(inventory).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(inventory.id, id));
  res.status(200).json({ status: 'success', message: 'Item updated' });
});

export const deleteInventoryItem = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(inventory).where(eq(inventory.id, id));
  res.status(200).json({ status: 'success', message: 'Item deleted' });
});

export const getInventoryTransactions = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.inventoryTransactions.findMany({
    with: {
      inventoryItem: true,
      student: true
    },
    where: (transactions, { exists }) => exists(
      db.select().from(inventory).where(and(eq(inventory.id, transactions.inventoryId), eq(inventory.schoolId, schoolId)))
    ),
    orderBy: [desc(inventoryTransactions.transactionDate)]
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
  if (item && (status === 'returned' || status === 'active')) {
    await db.update(inventory)
      .set({ availableQuantity: item.availableQuantity + transaction.quantity })
      .where(eq(inventory.id, item.id));
  }

  res.status(200).json({ status: 'success', message: 'Item checked in' });
});

// --- Medical & Fitness ---
export const getStudentMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const result = await db.query.medicalRecords.findFirst({
    where: eq(medicalRecords.studentId, studentId)
  });
  res.status(200).json({ status: 'success', data: result || null });
});

export const updateMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const data = req.body;
  const existing = await db.query.medicalRecords.findFirst({ where: eq(medicalRecords.studentId, studentId) });
  
  if (existing) {
    await db.update(medicalRecords).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(medicalRecords.studentId, studentId));
  } else {
    await db.insert(medicalRecords).values({ id: uuidv4(), studentId, ...data });
  }
  res.status(200).json({ status: 'success', message: 'Medical record updated' });
});

// --- Skill Assessments ---
export const addSkillAssessment = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const data = req.body;
  await db.insert(skillAssessments).values({ id, ...data });
  res.status(201).json({ status: 'success', message: 'Assessment saved' });
});

// --- Requisitions ---
export const getRequisitions = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.select().from(requisitions).where(eq(requisitions.schoolId, schoolId));
  res.status(200).json({ status: 'success', data: result });
});

export const addRequisition = asyncHandler(async (req: Request, res: Response) => {
  const id = uuidv4();
  const data = req.body;
  await db.insert(requisitions).values({ id, ...data });
  res.status(201).json({ status: 'success', message: 'Requisition raised' });
});

export const updateRequisition = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const data = req.body;
  await db.update(requisitions).set(data).where(eq(requisitions.id, id));
  res.status(200).json({ status: 'success', message: 'Requisition updated' });
});

export const deleteRequisition = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(requisitions).where(eq(requisitions.id, id));
  res.status(200).json({ status: 'success', message: 'Requisition deleted' });
});
