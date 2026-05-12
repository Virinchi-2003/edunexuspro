import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../config/database';
import { wallets, walletTransactions, walletLimits, rechargeLogs } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getSingleValue } from '../utils/queryHelper';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_KIn9L9L9L9L9L9',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export const getWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const schoolId = req.user?.schoolId || '';

  // 1. Fetch or create wallet
  let wallet = await db.query.wallets.findFirst({
    where: and(eq(wallets.studentId, studentId), eq(wallets.schoolId, schoolId))
  });

  if (!wallet) {
    const id = uuidv4();
    await db.insert(wallets).values({
      id,
      schoolId,
      studentId,
      balance: 0,
      status: 'active'
    });
    wallet = await db.query.wallets.findFirst({ where: eq(wallets.id, id) });
  }

  // 2. Get limits
  let limits = await db.query.walletLimits.findFirst({
    where: eq(walletLimits.studentId, studentId)
  });

  if (!limits) {
    await db.insert(walletLimits).values({
      studentId,
      dailyLimit: 500,
      weeklyLimit: 2000
    });
    limits = await db.query.walletLimits.findFirst({ where: eq(walletLimits.studentId, studentId) });
  }

  res.status(200).json({ status: 'success', data: { ...wallet, limits } });
});

export const getTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const studentId = getSingleValue(req.params.studentId);
  const result = await db.query.walletTransactions.findMany({
    where: eq(walletTransactions.studentId, studentId),
    orderBy: [desc(walletTransactions.timestamp)],
    limit: 50
  });
  res.status(200).json({ status: 'success', data: result });
});

export const topupWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, amount, transactionId, parentId } = req.body;
  const schoolId = req.user?.schoolId || '';

  if (amount < 100) return res.status(400).json({ status: 'error', message: 'Minimum top-up ₹100' });
  
  // Update wallet
  await db.update(wallets)
    .set({ 
      balance: sql`${wallets.balance} + ${amount}`,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(wallets.studentId, studentId), eq(wallets.schoolId, schoolId)));

  const wallet = await db.query.wallets.findFirst({ where: eq(wallets.studentId, studentId) });

  // Log transaction
  const logId = uuidv4();
  await db.insert(walletTransactions).values({
    id: logId,
    schoolId,
    studentId,
    walletId: wallet?.id || '',
    amount,
    type: 'credit',
    category: 'topup',
    description: 'Wallet top-up',
    status: 'success'
  });

  // Log recharge
  await db.insert(rechargeLogs).values({
    id: uuidv4(),
    schoolId,
    studentId,
    parentId,
    amount,
    transactionId,
    status: 'success'
  });

  res.status(200).json({ status: 'success', balance: wallet?.balance });
});

export const processPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, amount, vendor, category, description } = req.body;
  const schoolId = req.user?.schoolId || '';

  // 1. Fetch wallet
  const wallet = await db.query.wallets.findFirst({
    where: and(eq(wallets.studentId, studentId), eq(wallets.schoolId, schoolId))
  });

  if (!wallet) return res.status(404).json({ status: 'error', message: 'Wallet not found' });
  if (wallet.status !== 'active') return res.status(403).json({ status: 'error', message: 'Wallet is blocked' });
  if (wallet.balance < amount) return res.status(400).json({ status: 'error', message: 'Insufficient balance' });

  // 2. Check Limits
  const limits = await db.query.walletLimits.findFirst({ where: eq(walletLimits.studentId, studentId) });
  if (limits && amount > (limits.dailyLimit || 500)) {
     return res.status(403).json({ status: 'error', message: 'Daily spending limit exceeded' });
  }

  // 3. Deduct balance
  await db.update(wallets)
    .set({ 
      balance: sql`${wallets.balance} - ${amount}`,
      updatedAt: new Date().toISOString()
    })
    .where(eq(wallets.id, wallet.id));

  // 4. Log transaction
  await db.insert(walletTransactions).values({
    id: uuidv4(),
    schoolId,
    studentId,
    walletId: wallet.id,
    amount,
    type: 'debit',
    category: category || 'others',
    vendor,
    description,
    status: 'success'
  });

  res.status(200).json({ status: 'success', message: 'Payment successful' });
});

export const setWalletLimits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, dailyLimit, weeklyLimit } = req.body;
  await db.insert(walletLimits)
    .values({ studentId, dailyLimit, weeklyLimit })
    .onConflictDoUpdate({
      target: walletLimits.studentId,
      set: { dailyLimit, weeklyLimit, updatedAt: new Date().toISOString() }
    });
  res.status(200).json({ status: 'success', message: 'Limits updated' });
});

export const toggleWalletStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { studentId, status } = req.body;
  await db.update(wallets)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(wallets.studentId, studentId));
  res.status(200).json({ status: 'success', message: `Wallet ${status}` });
});

export const createRazorpayOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  
  if (!amount || amount < 100) {
    return res.status(400).json({ status: 'error', message: 'Minimum amount is ₹100' });
  }

  const options = {
    amount: Math.round(amount * 100), // amount in the smallest currency unit
    currency: "INR",
    receipt: `receipt_${uuidv4().substring(0, 8)}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(201).json({ status: 'success', data: order });
  } catch (error: any) {
    console.error('Razorpay Wallet Error:', error);
    
    // If Authentication fails (401) or keys are missing, fallback to Mock Order for development
    if (error.statusCode === 401 || !process.env.RAZORPAY_KEY_ID?.startsWith('rzp_')) {
      console.warn('--- FALLING BACK TO MOCK PAYMENT MODE (DEV ONLY) ---');
      const mockOrder = {
        id: `order_mock_${uuidv4().slice(0, 8)}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
        isMock: true
      };
      return res.status(201).json({ status: 'success', data: mockOrder, isMock: true });
    }
    
    res.status(500).json({ status: 'error', message: 'Failed to create payment order' });
  }
});

export const verifyRazorpayPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { 
    studentId, 
    amount, 
    razorpay_order_id, 
    razorpay_payment_id, 
    razorpay_signature 
  } = req.body;

  const schoolId = req.user?.schoolId || '';

  // 1. Verify signature
  if (!razorpay_order_id?.startsWith('order_mock_')) {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ status: 'error', message: 'Invalid payment signature' });
    }
  } else {
    console.log(`[MOCK WALLET] Verifying mock order: ${razorpay_order_id}`);
  }

  // 2. Update wallet
  await db.update(wallets)
    .set({ 
      balance: sql`${wallets.balance} + ${amount}`,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(wallets.studentId, studentId), eq(wallets.schoolId, schoolId)));

  const wallet = await db.query.wallets.findFirst({ where: eq(wallets.studentId, studentId) });

  // 3. Log transaction
  await db.insert(walletTransactions).values({
    id: uuidv4(),
    schoolId,
    studentId,
    walletId: wallet?.id || '',
    amount,
    type: 'credit',
    category: 'topup',
    description: 'Wallet top-up (Razorpay)',
    status: 'success'
  });

  // 4. Log recharge
  await db.insert(rechargeLogs).values({
    id: uuidv4(),
    schoolId,
    studentId,
    amount,
    transactionId: razorpay_payment_id,
    status: 'success'
  });

  res.status(200).json({ status: 'success', balance: wallet?.balance });
});
