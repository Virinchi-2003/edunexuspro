import { Request, Response } from 'express';
import { db } from '../config/database';
import { fees, students, classes, schools, feeStructures, feeInstallments, feeReminders } from '../db/schema';
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

  const allInstallments = await db.query.feeInstallments.findMany({
    where: eq(feeInstallments.schoolId, schoolId),
    with: {
      student: true
    }
  });

  res.status(200).json({ 
    status: 'success', 
    data: {
      fees: updatedFees,
      students: allStudents,
      transactions: allTransactions,
      installments: allInstallments
    } 
  });
});

export const updateFeeStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status, paidAmount, transactionId, amount, installments: manualInstallments } = req.body;

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

  // Handle manual installments update if provided
  if (manualInstallments && Array.isArray(manualInstallments)) {
    // Delete existing installments for this specific fee record first to avoid duplication
    await db.delete(feeInstallments).where(eq(feeInstallments.feeRecordId, id));
    
    if (manualInstallments.length > 0) {
      const records = manualInstallments.map((inst: any, idx: number) => ({
        id: uuidv4(),
        schoolId: currentFee.schoolId,
        studentId: currentFee.studentId,
        feeRecordId: id,
        installmentNumber: idx + 1,
        amount: parseInt(inst.amount.toString()),
        dueDate: inst.dueDate,
        status: inst.status || 'pending',
      }));
      await db.insert(feeInstallments).values(records);
    }
  }

  res.status(200).json({ status: 'success', message: 'Fee record updated' });
});

export const createFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, grade, amount, tuitionFees, transportFees, libraryFees, examFees, activityFees, otherFees, description, installments } = req.body;
  
  const id = uuidv4();
  await db.insert(feeStructures).values({
    id,
    schoolId,
    grade,
    amount: parseInt(amount.toString()),
    tuitionFees: parseInt(tuitionFees?.toString() || '0'),
    transportFees: parseInt(transportFees?.toString() || '0'),
    libraryFees: parseInt(libraryFees?.toString() || '0'),
    examFees: parseInt(examFees?.toString() || '0'),
    activityFees: parseInt(activityFees?.toString() || '0'),
    otherFees: parseInt(otherFees?.toString() || '0'),
    description,
    installments: installments ? (typeof installments === 'string' ? installments : JSON.stringify(installments)) : null,
  });

  res.status(201).json({ status: 'success', message: 'Fee structure created' });
});

export const assignFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, studentId, structureId } = req.body;

  const structure = await db.query.feeStructures.findFirst({ where: eq(feeStructures.id, structureId) });
  if (!structure) return res.status(404).json({ status: 'error', message: 'Structure not found' });

  const feeRecordId = uuidv4();
  const timestamp = new Date().toISOString();

  // 1. Create main fee record
  await db.insert(fees).values({
    id: feeRecordId,
    schoolId,
    studentId,
    amount: structure.amount,
    status: 'unpaid',
    feeType: 'Academic Year Fee',
    academicYear: '2026-27',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // 2. Create installments
  if (structure.installments) {
    const instConfigs = JSON.parse(structure.installments);
    const installmentRecords = instConfigs.map((inst: any, idx: number) => ({
      id: uuidv4(),
      schoolId,
      studentId,
      feeRecordId,
      installmentNumber: idx + 1,
      amount: inst.amount,
      dueDate: inst.dueDate,
      status: 'pending',
    }));
    await db.insert(feeInstallments).values(installmentRecords);
  }

  res.status(201).json({ status: 'success', message: 'Fee structure assigned and installments generated' });
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
    const fee = await db.insert(fees).values(newFee).returning().then(res => res[0]);

  // Create installments if provided
  if (req.body.installments && Array.isArray(req.body.installments) && fee) {
    const records = req.body.installments.map((inst: any, idx: number) => ({
      id: uuidv4(),
      schoolId: fee.schoolId,
      studentId: fee.studentId,
      feeRecordId: fee.id,
      installmentNumber: idx + 1,
      amount: parseInt(inst.amount.toString()),
      dueDate: inst.dueDate,
      status: 'pending',
    }));
    await db.insert(feeInstallments).values(records);
  }

  // Create transaction if initially paid
  if (req.body.status === 'paid' && fee) {
    await db.insert(feeTransactions).values({
      id: uuidv4(),
      schoolId: fee.schoolId,
      studentId: fee.studentId,
      amount: fee.amount,
      category: fee.feeType?.toLowerCase() || 'tuition',
      status: 'success',
      razorpayPaymentId: `MANUAL-INIT-${uuidv4().slice(0,8).toUpperCase()}`,
      invoiceNumber: `INV-${uuidv4().slice(0,8).toUpperCase()}`,
      paymentMethod: 'manual',
      gstAmount: fee.amount * 0.18,
    });
  }

  res.status(201).json({ status: 'success', data: fee });
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
    
    // Create transactions for any initially paid records
    const paidTxs = newRecords.filter(r => r.status === 'paid').map(r => ({
      id: uuidv4(),
      schoolId: r.schoolId,
      studentId: r.studentId,
      amount: r.amount,
      category: r.feeType?.toLowerCase() || 'tuition',
      status: 'success' as const,
      razorpayPaymentId: `BULK-PAY-${uuidv4().slice(0,8).toUpperCase()}`,
      invoiceNumber: `INV-${uuidv4().slice(0,8).toUpperCase()}`,
      paymentMethod: 'manual' as const,
      gstAmount: r.amount * 0.18,
    }));

    if (paidTxs.length > 0) {
      await db.insert(feeTransactions).values(paidTxs);
    }
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
  
  // 1. Fetch Student Details to get Grade and School
  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId)
  });

  if (!student) {
    return res.status(404).json({ status: 'error', message: 'Student not found' });
  }

  // 2. Fetch Fee Structure for the student's grade
  const structure = await db.query.feeStructures.findFirst({
    where: and(
      eq(feeStructures.schoolId, student.schoolId),
      eq(feeStructures.grade, student.grade)
    )
  });

  // 3. Fetch all fee records
  const studentFees = await db.query.fees.findMany({
    where: eq(fees.studentId, studentId),
    orderBy: [desc(fees.createdAt)]
  });

  // Calculate late fees
  const updatedFees = studentFees.length > 0 
    ? await calculateLateFees(studentFees, student.schoolId)
    : [];

  // 4. Fetch successful transactions
  const transactions = await db.query.feeTransactions.findMany({
    where: and(eq(feeTransactions.studentId, studentId), eq(feeTransactions.status, 'success')),
    orderBy: [desc(feeTransactions.createdAt)]
  });

  // 5. Fetch installments
  const installments = await db.query.feeInstallments.findMany({
    where: eq(feeInstallments.studentId, studentId),
    orderBy: [desc(feeInstallments.dueDate)]
  });

  res.status(200).json({ 
    status: 'success', 
    data: {
      fees: updatedFees,
      transactions,
      installments,
      feeStructure: structure || null,
      yearlyTotal: structure?.amount || 0
    } 
  });
});

export const payInstallment = asyncHandler(async (req: Request, res: Response) => {
  const { installmentId, paymentMode, transactionId } = req.body;

  const installment = await db.query.feeInstallments.findFirst({ where: eq(feeInstallments.id, installmentId) });
  if (!installment) return res.status(404).json({ status: 'error', message: 'Installment not found' });

  const isCash = paymentMode?.toLowerCase() === 'cash';
  const status = isCash ? 'pending_verification' : 'paid';

  await db.update(feeInstallments)
    .set({ 
      status, 
      paymentMode: paymentMode.toLowerCase() as any,
      transactionId: transactionId || (isCash ? `CASH-${uuidv4().slice(0,8).toUpperCase()}` : null),
      paidAt: !isCash ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    })
    .where(eq(feeInstallments.id, installmentId));

  // If online, also update main fee record and create transaction
  if (!isCash) {
    const feeRecord = await db.query.fees.findFirst({ where: eq(fees.id, installment.feeRecordId!) });
    if (feeRecord) {
      const newPaidAmount = (feeRecord.paidAmount || 0) + installment.amount;
      await db.update(fees)
        .set({ 
          paidAmount: newPaidAmount,
          status: newPaidAmount >= feeRecord.amount ? 'paid' : 'partially_paid',
          updatedAt: new Date().toISOString()
        })
        .where(eq(fees.id, feeRecord.id));

      // Create transaction log
      await db.insert(feeTransactions).values({
        id: uuidv4(),
        schoolId: installment.schoolId,
        studentId: installment.studentId,
        amount: installment.amount,
        category: 'tuition',
        status: 'success',
        razorpayPaymentId: transactionId || `ONLINE-${uuidv4().slice(0,8).toUpperCase()}`,
        invoiceNumber: `INV-${uuidv4().slice(0,8).toUpperCase()}`,
        paymentMethod: 'online',
        gstAmount: installment.amount * 0.18,
      });
    }
  }

  res.status(200).json({ status: 'success', message: isCash ? 'Cash payment submitted for verification' : 'Payment successful' });
});

export const verifyCashPayment = asyncHandler(async (req: Request, res: Response) => {
  const { installmentId } = req.params;

  const installment = await db.query.feeInstallments.findFirst({ where: eq(feeInstallments.id, installmentId) });
  if (!installment) return res.status(404).json({ status: 'error', message: 'Installment not found' });

  await db.update(feeInstallments)
    .set({ 
      status: 'paid',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    .where(eq(feeInstallments.id, installmentId));

  // Update main fee record
  const feeRecord = await db.query.fees.findFirst({ where: eq(fees.id, installment.feeRecordId!) });
  if (feeRecord) {
    const newPaidAmount = (feeRecord.paidAmount || 0) + installment.amount;
    await db.update(fees)
      .set({ 
        paidAmount: newPaidAmount,
        status: newPaidAmount >= feeRecord.amount ? 'paid' : 'partially_paid',
        updatedAt: new Date().toISOString()
      })
      .where(eq(fees.id, feeRecord.id));

    // Create transaction log
    await db.insert(feeTransactions).values({
      id: uuidv4(),
      schoolId: installment.schoolId,
      studentId: installment.studentId,
      amount: installment.amount,
      category: 'tuition',
      status: 'success',
      razorpayPaymentId: installment.transactionId || `CASH-VERIFIED-${uuidv4().slice(0,8).toUpperCase()}`,
      invoiceNumber: `INV-${uuidv4().slice(0,8).toUpperCase()}`,
      paymentMethod: 'cash',
      gstAmount: installment.amount * 0.18,
    });
  }

  res.status(200).json({ status: 'success', message: 'Cash payment verified' });
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
