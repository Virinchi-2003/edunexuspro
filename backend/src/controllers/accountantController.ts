import { Request, Response } from 'express';
import { db } from '../config/database';
import { 
  fees, 
  students, 
  staff, 
  requisitions, 
  salaryPayments, 
  supportTickets,
  feeTransactions
} from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';

export const getFinancialStats = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);

  // 1. Fee Stats
  const feeRecords = await db.select({
    total: sql<number>`SUM(${fees.amount})`,
    collected: sql<number>`SUM(${fees.paidAmount})`
  }).from(fees).where(eq(fees.schoolId, schoolId));

  // 2. Salary Stats
  const salaryRecords = await db.select({
    total: sql<number>`SUM(${staff.salary})`
  }).from(staff).where(eq(staff.schoolId, schoolId));

  // 3. Pending Requisitions
  const pendingReqs = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(requisitions).where(and(eq(requisitions.schoolId, schoolId), eq(requisitions.status, 'pending')));

  // 4. Open Support Tickets
  const openTickets = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(supportTickets).where(and(eq(supportTickets.schoolId, schoolId), eq(supportTickets.status, 'open')));

  res.status(200).json({
    status: 'success',
    data: {
      fees: {
        total: feeRecords[0].total || 0,
        collected: feeRecords[0].collected || 0,
        pending: (feeRecords[0].total || 0) - (feeRecords[0].collected || 0)
      },
      salaries: {
        monthlyTotal: salaryRecords[0].total || 0
      },
      pendingRequisitions: pendingReqs[0].count || 0,
      openTickets: openTickets[0].count || 0
    }
  });
});

// --- Salary Management ---
export const getSalaryRecords = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.staff.findMany({
    where: eq(staff.schoolId, schoolId),
    columns: {
      id: true,
      name: true,
      role: true,
      department: true,
      salary: true,
      status: true
    }
  });
  res.status(200).json({ status: 'success', data: result });
});

export const processSalaryPayment = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, staffId, amount, month, bonus, deductions, notes } = req.body;
  const id = uuidv4();

  await db.insert(salaryPayments).values({
    id,
    schoolId,
    staffId,
    amount: parseInt(amount),
    month,
    bonus: bonus ? parseInt(bonus) : 0,
    deductions: deductions ? parseInt(deductions) : 0,
    notes,
    status: 'paid'
  });

  res.status(201).json({ status: 'success', message: 'Salary payment recorded' });
});

export const getSalaryHistory = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.salaryPayments.findMany({
    where: eq(salaryPayments.schoolId, schoolId),
    with: {
      staff: true
    },
    orderBy: [desc(salaryPayments.paymentDate)]
  });
  res.status(200).json({ status: 'success', data: result });
});

// --- Support / Contact Management ---
export const getSupportTickets = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.supportTickets.findMany({
    where: eq(supportTickets.schoolId, schoolId),
    with: {
      student: true,
      staff: true
    },
    orderBy: [desc(supportTickets.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const updateTicketStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status, assignedTo } = req.body;

  await db.update(supportTickets)
    .set({ status, assignedTo, updatedAt: new Date().toISOString() })
    .where(eq(supportTickets.id, id));

  res.status(200).json({ status: 'success', message: 'Ticket updated' });
});

// --- Requisitions (Requirement Management) ---
export const getAccountantRequisitions = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  const result = await db.query.requisitions.findMany({
    where: eq(requisitions.schoolId, schoolId),
    orderBy: [desc(requisitions.createdAt)]
  });
  res.status(200).json({ status: 'success', data: result });
});

export const updateRequisitionStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status } = req.body;

  await db.update(requisitions)
    .set({ status })
    .where(eq(requisitions.id, id));

  res.status(200).json({ status: 'success', message: 'Requisition status updated' });
});

export const sendCustomFeeReminder = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, recipients, message, subject } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No recipients selected' });
  }

  // In a real app, this would use Nodemailer or an Email Service
  // For now, we simulate sending and log the action
  console.log(`[CUSTOM REMINDER] School: ${schoolId}`);
  console.log(`[CUSTOM REMINDER] Subject: ${subject || 'Fee Payment Reminder'}`);
  console.log(`[CUSTOM REMINDER] Message: ${message}`);
  console.log(`[CUSTOM REMINDER] Recipients: ${recipients.join(', ')}`);

  res.status(200).json({ 
    status: 'success', 
    message: `Reminder successfully sent to ${recipients.length} recipients.` 
  });
});
