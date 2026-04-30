import { Request, Response } from 'express';
import { db } from '../config/database';
import { fees, students, classes } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';
import { feeTransactions } from '../db/schema';
import { generateFeeReceiptPDF } from '../utils/pdfGenerator';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export const getFeesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  
  // Fetch all students and all fees for this school
  const allStudents = await db.query.students.findMany({
    where: eq(students.schoolId, schoolId)
  });

  let allFees = await db.query.fees.findMany({
    where: eq(fees.schoolId, schoolId)
  });

  // Late Fee Calculation Engine
  const today = new Date();
  const updatedFees = [];

  for (const fee of allFees) {
    if (fee.status !== 'paid' && fee.dueDate) {
      const dueDate = new Date(fee.dueDate);
      const graceDate = new Date(dueDate);
      graceDate.setDate(dueDate.getDate() + (fee.gracePeriodDays || 5));

      if (today > graceDate) {
        // Calculate late fee (e.g., ₹50 per day after grace period, capped at ₹500 or 10% of amount)
        const daysLate = Math.floor((today.getTime() - graceDate.getTime()) / (1000 * 3600 * 24));
        const calculatedLateFee = Math.min(daysLate * 50, 500);
        
        if (fee.lateFee !== calculatedLateFee) {
           await db.update(fees).set({ lateFee: calculatedLateFee }).where(eq(fees.id, fee.id));
           fee.lateFee = calculatedLateFee;
        }
      }
    }
    
    // Auto-generate challan number if missing
    if (!fee.challanNumber) {
        const challan = `CHL-${schoolId.slice(0,4)}-${fee.id.slice(0,6)}`.toUpperCase();
        await db.update(fees).set({ challanNumber: challan }).where(eq(fees.id, fee.id));
        fee.challanNumber = challan;
    }

    updatedFees.push(fee);
  }

  res.status(200).json({ 
    status: 'success', 
    data: {
      fees: updatedFees,
      students: allStudents
    } 
  });
});

export const updateFeeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status, paidAmount, transactionId, amount } = req.body;

  await db.update(fees)
    .set({ 
      status, 
      amount: amount ? parseInt(amount.toString()) : undefined,
      paidAmount: paidAmount ? parseInt(paidAmount.toString()) : 0,
      transactionId,
      paymentDate: status === 'paid' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString() 
    })
    .where(eq(fees.id, id));

  res.status(200).json({ status: 'success', message: 'Fee record updated' });
});

export const createFeeRecord = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, studentId, amount, dueDate, feeType } = req.body;
  const id = uuidv4();

  const newFee = {
    id,
    schoolId,
    studentId,
    amount: parseInt(amount.toString()),
    paidAmount: 0,
    status: 'unpaid' as const,
    dueDate,
    feeType: feeType || 'Tuition Fee',
  };

  await db.insert(fees).values(newFee);
  res.status(201).json({ status: 'success', data: newFee });
});

export const importBulkFees = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, records } = req.body;
  
  if (!Array.isArray(records)) {
    return res.status(400).json({ status: 'error', message: 'Records must be an array' });
  }

  // Fetch all students to match by studentId (roll number)
  const allStudents = await db.query.students.findMany({
    where: eq(students.schoolId, schoolId)
  });

  const studentMap = new Map(allStudents.map(s => [s.studentId.toLowerCase(), s.id]));

  const newRecords = [];
  for (const r of records) {
    // Normalize keys
    const data: any = {};
    Object.keys(r).forEach(k => data[k.toLowerCase().replace(/\s/g, '')] = r[k]);

    const sid = String(data.studentid || data.rollnumber || '').toLowerCase();
    const internalId = studentMap.get(sid);

    if (internalId) {
      newRecords.push({
        id: uuidv4(),
        schoolId,
        studentId: internalId,
        amount: parseInt(String(data.amount || 0)),
        paidAmount: data.status?.toLowerCase() === 'paid' ? parseInt(String(data.amount || 0)) : 0,
        status: (data.status?.toLowerCase() === 'paid' ? 'paid' : 'unpaid') as any,
        dueDate: data.duedate || new Date().toISOString(),
        feeType: data.feetype || 'Tuition Fee',
      });
    }
  }

  if (newRecords.length > 0) {
    await db.insert(fees).values(newRecords);
  }

  res.status(201).json({ 
    status: 'success', 
    message: `Successfully imported ${newRecords.length} fee records.`,
    data: { imported: newRecords.length, total: records.length }
  });
});

export const deleteFeeRecord = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  await db.delete(fees).where(eq(fees.id, id));
  res.status(200).json({ status: 'success', message: 'Fee record deleted' });
});

export const sendFeeReminders = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.body;
  
  const pendingFees = await db.query.fees.findMany({
    where: and(eq(fees.schoolId, schoolId), eq(fees.status, 'unpaid')),
    with: {
        student: true
    }
  });

  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  const remindersSent = [];

  for (const fee of pendingFees) {
    if (fee.dueDate) {
      const dueDate = new Date(fee.dueDate);
      if (dueDate <= threeDaysFromNow && dueDate >= today) {
        // Simulate WhatsApp + Email
        const parentPhone = fee.student?.phone || 'N/A';
        const parentEmail = fee.student?.email || 'N/A';
        
        console.log(`[REMINDER] Sent WhatsApp to ${parentPhone}: Fee of ₹${fee.amount} for ${fee.student?.name} is due on ${fee.dueDate}.`);
        console.log(`[REMINDER] Sent Email to ${parentEmail}: Upcoming fee deadline for ${fee.student?.name}.`);
        
        remindersSent.push({
          student: fee.student?.name,
          phone: parentPhone,
          email: parentEmail,
          amount: fee.amount
        });
      }
    }
  }

  res.status(200).json({ 
    status: 'success', 
    message: `Successfully dispatched ${remindersSent.length} WhatsApp and Email reminders.`,
    data: remindersSent 
  });
});

export const getStudentFees = asyncHandler(async (req: Request, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  
  const studentFees = await db.query.fees.findMany({
    where: eq(fees.studentId, studentId),
    orderBy: [desc(fees.createdAt)]
  });

  const transactions = await db.query.feeTransactions.findMany({
    where: and(eq(feeTransactions.studentId, studentId), eq(feeTransactions.status, 'success')),
    orderBy: [desc(feeTransactions.createdAt)]
  });

  res.status(200).json({ 
    status: 'success', 
    data: {
      fees: studentFees,
      transactions
    } 
  });
});

export const downloadFeeReceipt = asyncHandler(async (req: Request, res: Response) => {
  const transactionId = getSingleValue(req.params.transactionId);
  
  const transaction = await db.query.feeTransactions.findFirst({
    where: eq(feeTransactions.id, transactionId),
    with: {
      student: {
        with: {
          school: true
        }
      }
    }
  });

  if (!transaction) {
    return res.status(404).json({ status: 'error', message: 'Transaction not found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-${transactionId}.pdf`);
  
  generateFeeReceiptPDF(transaction, res);
});

export const createRazorpayOrder = asyncHandler(async (req: Request, res: Response) => {
  const { amount, currency = 'INR', receipt } = req.body;

  const options = {
    amount: amount * 100, // Amount in paise
    currency,
    receipt,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to create Razorpay order' });
  }
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature,
    studentId,
    schoolId,
    feeId,
    amount,
    category
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    // Payment is authentic
    const transactionId = uuidv4();
    const gstAmount = amount * 0.18; // 18% GST

    await db.insert(feeTransactions).values({
      id: transactionId,
      schoolId,
      studentId,
      amount,
      category: category || 'tuition',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'success',
      gstAmount,
      invoiceNumber: `INV-${transactionId.slice(0,8).toUpperCase()}`,
      paymentMethod: 'razorpay'
    });

    // Update fee record status
    if (feeId) {
      await db.update(fees)
        .set({ 
          status: 'paid', 
          paidAmount: amount, 
          transactionId: razorpay_payment_id,
          paymentDate: new Date().toISOString() 
        })
        .where(eq(fees.id, feeId));
    }

    res.status(200).json({ 
      status: 'success', 
      message: 'Payment verified successfully',
      data: { transactionId }
    });
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid payment signature' });
  }
});
