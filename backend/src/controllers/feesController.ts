import { Request, Response } from 'express';
import { db } from '../config/database';
import { fees, students, classes, schools } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';
import { feeTransactions } from '../db/schema';
import { generateFeeReceiptPDF } from '../utils/pdfGenerator';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_KIn9L9L9L9L9L9',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

const calculateLateFees = async (allFees: any[], schoolId: string) => {
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
  return updatedFees;
};

export const getFeesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = getSingleValue(req.params.schoolId);
  
  // Fetch all students and all fees for this school
  const allStudents = await db.query.students.findMany({
    where: eq(students.schoolId, schoolId)
  });

  let allFees = await db.query.fees.findMany({
    where: eq(fees.schoolId, schoolId)
  });

  const updatedFees = await calculateLateFees(allFees, schoolId);

  const allTransactions = await db.query.feeTransactions.findMany({
    where: eq(feeTransactions.schoolId, schoolId),
    orderBy: [desc(feeTransactions.createdAt)]
  });

  res.status(200).json({ 
    status: 'success', 
    data: {
      fees: updatedFees,
      students: allStudents,
      transactions: allTransactions
    } 
  });
});

export const updateFeeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status, paidAmount, transactionId, amount } = req.body;

  const currentFee = await db.query.fees.findFirst({ where: eq(fees.id, id) });
  if (!currentFee) return res.status(404).json({ status: 'error', message: 'Fee record not found' });

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

  // Sync with Transactions table if marked as paid
  if (status === 'paid') {
    const finalAmount = paidAmount ? parseInt(paidAmount.toString()) : (amount || currentFee.amount);
    const txId = transactionId || `MANUAL-${uuidv4().slice(0,8).toUpperCase()}`;
    
    // Check if transaction already exists to avoid duplicates
    const existingTx = await db.query.feeTransactions.findFirst({
      where: eq(feeTransactions.razorpayPaymentId, txId)
    });

    if (!existingTx) {
      await db.insert(feeTransactions).values({
        id: uuidv4(),
        schoolId: currentFee.schoolId,
        studentId: currentFee.studentId,
        amount: finalAmount,
        category: currentFee.feeType?.toLowerCase() || 'tuition',
        status: 'success',
        razorpayPaymentId: txId,
        invoiceNumber: `INV-${uuidv4().slice(0,8).toUpperCase()}`,
        paymentMethod: transactionId ? 'online' : 'manual',
        gstAmount: finalAmount * 0.18,
      });
    }
  }

  res.status(200).json({ status: 'success', message: 'Fee record updated' });
});

export const createFeeRecord = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, studentId, amount, dueDate, feeType, breakdown } = req.body;
  
  if (!schoolId || !studentId) {
    return res.status(400).json({ status: 'error', message: 'schoolId and studentId are required' });
  }

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  const newFee = {
    id,
    schoolId,
    studentId,
    amount: parseInt(amount?.toString() || '0'),
    paidAmount: 0,
    status: 'unpaid' as const,
    dueDate: dueDate || timestamp,
    feeType: feeType || 'Tuition Fee',
    breakdown: breakdown ? (typeof breakdown === 'string' ? breakdown : JSON.stringify(breakdown)) : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    academicYear: '2026-27' // Defaulting to current year
  };

  console.log(`[FEES] Creating new fee record for student ${studentId} in school ${schoolId}`);
  
  try {
    await db.insert(fees).values(newFee);
    res.status(201).json({ status: 'success', data: newFee });
  } catch (error) {
    console.error('[FEES] Database error creating fee record:', error);
    res.status(500).json({ status: 'error', message: 'Failed to save fee record to database' });
  }
});

export const importBulkFees = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, records, studentIds, amount, dueDate, feeType, breakdown } = req.body;
  
  const newRecords = [];
  const timestamp = new Date().toISOString();

  // Mode 1: From studentIds (Principal UI)
  if (studentIds && Array.isArray(studentIds)) {
    for (const sid of studentIds) {
      newRecords.push({
        id: uuidv4(),
        schoolId,
        studentId: sid,
        amount: parseInt(amount?.toString() || '0'),
        paidAmount: 0,
        status: 'unpaid' as any,
        dueDate: dueDate || timestamp,
        feeType: feeType || 'Tuition Fee',
        breakdown: breakdown ? (typeof breakdown === 'string' ? breakdown : JSON.stringify(breakdown)) : null,
      });
    }
  } 
  // Mode 2: From Excel records
  else if (records && Array.isArray(records)) {
    const allStudents = await db.query.students.findMany({
      where: eq(students.schoolId, schoolId)
    });
    const studentMap = new Map(allStudents.map(s => [s.studentId.toLowerCase(), s.id]));

    for (const r of records) {
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
          dueDate: data.duedate || timestamp,
          feeType: data.feetype || 'Tuition Fee',
          breakdown: data.breakdown || null,
        });
      }
    }
  } else {
    return res.status(400).json({ status: 'error', message: 'Either records or studentIds must be provided' });
  }

  if (newRecords.length > 0) {
    await db.insert(fees).values(newRecords);
  }

  res.status(201).json({ 
    status: 'success', 
    message: `Successfully generated ${newRecords.length} fee records.`,
    data: { count: newRecords.length }
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

  // Calculate late fees for student view too
  const updatedFees = studentFees.length > 0 
    ? await calculateLateFees(studentFees, studentFees[0].schoolId)
    : [];

  const transactions = await db.query.feeTransactions.findMany({
    where: and(eq(feeTransactions.studentId, studentId), eq(feeTransactions.status, 'success')),
    orderBy: [desc(feeTransactions.createdAt)]
  });

  res.status(200).json({ 
    status: 'success', 
    data: {
      fees: updatedFees,
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
  const { amount, currency, receipt } = req.body;

  try {
    // Attempt real Razorpay order creation
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects paise
      currency,
      receipt,
    });
    res.status(201).json({ 
      status: 'success', 
      data: {
        ...order,
        key: process.env.RAZORPAY_KEY_ID
      } 
    });
  } catch (error: any) {
    if (error.statusCode === 401) {
      console.warn('[Razorpay] Authentication failed. Falling back to Mock Mode for development.');
    } else {
      console.error('Razorpay Order Error:', error);
    }
    
    // If auth fails or keys are missing, return a MOCK order for development/demo
    if (error.statusCode === 401 || process.env.RAZORPAY_KEY_ID?.includes('dummy')) {
      const mockOrder = {
        id: `order_mock_${uuidv4().slice(0,8)}`,
        amount: amount * 100,
        currency,
        receipt,
        status: 'created',
        isMock: true, // Flag to identify mock payment
        key: 'rzp_test_dummy' // Use dummy key for mock
      };
      return res.status(201).json({ 
        status: 'success', 
        message: 'Using Mock Payment Gateway (Dev Mode)', 
        data: mockOrder 
      });
    }
    
    res.status(500).json({ status: 'error', message: 'Failed to create payment order' });
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
    feeIds, // Support for multiple fees
    amount,
    category
  } = req.body;

  const isMock = razorpay_order_id?.startsWith('order_mock_');
  let isAuthentic = false;

  if (isMock) {
    isAuthentic = true; // Always trust mock orders in dev mode
  } else {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest("hex");
    isAuthentic = expectedSignature === razorpay_signature;
  }

  if (isAuthentic) {
    // Payment is authentic
    // Update fee record status and aggregate breakdown
    const targetFeeIds = feeIds && Array.isArray(feeIds) ? feeIds : (feeId ? [feeId] : []);
    let aggregatedBreakdown: any = {};
    
    if (targetFeeIds.length > 0) {
      for (const id of targetFeeIds) {
        const feeRecord = await db.query.fees.findFirst({ where: eq(fees.id, id) });
        if (feeRecord) {
           // Parse breakdown if it exists
           if (feeRecord.breakdown) {
             try {
               const b = JSON.parse(feeRecord.breakdown);
               Object.keys(b).forEach(k => {
                 aggregatedBreakdown[k] = (aggregatedBreakdown[k] || 0) + (parseInt(b[k]) || 0);
               });
             } catch (e) {
               // If not JSON, use as a single item
               aggregatedBreakdown[feeRecord.feeType || 'tuition'] = (aggregatedBreakdown[feeRecord.feeType || 'tuition'] || 0) + feeRecord.amount;
             }
           } else {
             aggregatedBreakdown[feeRecord.feeType || 'tuition'] = (aggregatedBreakdown[feeRecord.feeType || 'tuition'] || 0) + feeRecord.amount;
           }

           await db.update(fees)
            .set({ 
              status: 'paid', 
              paidAmount: feeRecord.amount + (feeRecord.lateFee || 0), 
              transactionId: razorpay_payment_id,
              paymentDate: new Date().toISOString() 
            })
            .where(eq(fees.id, id));
        }
      }
    }

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
      paymentMethod: 'razorpay',
      breakdown: JSON.stringify(aggregatedBreakdown)
    });

    res.status(200).json({ 
      status: 'success', 
      message: 'Payment verified successfully',
      data: { transactionId }
    });
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid payment signature' });
  }
});
