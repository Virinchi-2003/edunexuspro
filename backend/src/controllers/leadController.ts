import { Request, Response } from 'express';
import { db } from '../config/database';
import { leads, schools, users, principals } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { sendCredentialEmail } from '../utils/mail';
import { getSingleValue } from '../utils/queryHelper';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export const createLead = asyncHandler(async (req: Request, res: Response) => {
  const { schoolName, adminName, email, phone, message, plan, paymentStatus } = req.body;

  if (!schoolName || !adminName || !email || !phone) {
    return res.status(400).json({ status: 'error', message: 'Required fields missing' });
  }

  const id = uuidv4();
  await db.insert(leads).values({
    id,
    schoolName,
    adminName,
    email,
    phone,
    message,
    plan,
    paymentStatus: paymentStatus || 'pending',
    status: 'new',
  });

  res.status(201).json({
    status: 'success',
    message: 'Your inquiry has been submitted. Our sales team will contact you soon.',
    data: { id }
  });
});

export const getLeads = asyncHandler(async (_req: Request, res: Response) => {
  const allLeads = await db.query.leads.findMany({
    orderBy: (leads, { desc }) => [desc(leads.createdAt)]
  });
  res.status(200).json({ status: 'success', data: allLeads });
});

export const updateLeadStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { status, adminNote } = req.body;

  // 1. Update the lead status
  await db.update(leads)
    .set({ 
      status: status as any, 
      adminNote, 
    })
    .where(eq(leads.id, id));

  // 2. If converted, auto-provision the school and admin account
  if (status === 'converted') {
    const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
    
    if (lead) {
      const schoolId = uuidv4();
      
      // Create School record
      await db.insert(schools).values({
        id: schoolId,
        name: lead.schoolName,
        address: 'Auto-converted from Sales Enquiry',
        contactEmail: lead.email,
        subscriptionPlan: lead.plan || 'starter',
        status: 'active'
      });

      // Create/Update Admin User
      const existingUser = await db.query.users.findFirst({ where: eq(users.email, lead.email) });
      const userId = existingUser?.uid || uuidv4();

      if (!existingUser) {
        await db.insert(users).values({
          uid: userId,
          email: lead.email,
          role: 'principal',
          schoolId: schoolId,
          status: 'active'
        });
      } else {
        await db.update(users)
          .set({ role: 'principal', schoolId: schoolId, status: 'active' })
          .where(eq(users.uid, userId));
      }

      // Create/Update Principal record
      const existingPrincipal = await db.query.principals.findFirst({ where: eq(principals.email, lead.email) });
      
      if (!existingPrincipal) {
        await db.insert(principals).values({
          id: uuidv4(),
          schoolId: schoolId,
          name: lead.adminName || `Principal of ${lead.schoolName}`,
          email: lead.email,
          userId: userId,
          status: 'active',
          phone: lead.phone || 'Not provided'
        });
      } else {
        await db.update(principals)
          .set({ 
            schoolId: schoolId, 
            name: lead.adminName || existingPrincipal.name,
            phone: lead.phone || existingPrincipal.phone,
            updatedAt: new Date().toISOString()
          })
          .where(eq(principals.id, existingPrincipal.id));
      }
    }
  }

  res.status(200).json({ 
    status: 'success', 
    message: status === 'converted' ? 'Enquiry converted to school successfully!' : 'Inquiry status updated' 
  });
});

export const replyToLead = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { reply } = req.body;

  // 1. Fetch lead details to get email and school name
  const lead = await db.query.leads.findFirst({
    where: eq(leads.id, id)
  });

  if (!lead) {
    return res.status(404).json({ status: 'error', message: 'Enquiry not found' });
  }

  // 2. Update database
  await db.update(leads)
    .set({ 
      reply, 
      status: 'contacted' 
    })
    .where(eq(leads.id, id));

  // 3. Send Email
  const mailResult = await sendCredentialEmail(lead.email, lead.schoolName, reply);

  res.status(200).json({ 
    status: 'success', 
    message: mailResult.success 
      ? (mailResult.simulated ? 'Reply saved! (Simulated Email Logged to Console)' : 'Reply sent via email successfully!')
      : 'Reply saved but email failed to send',
    mailSent: mailResult.success,
    simulated: mailResult.simulated
  });
});

export const updatePaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { paymentStatus } = req.body;

  // 1. Update Payment Status
  await db.update(leads)
    .set({ paymentStatus })
    .where(eq(leads.id, id));

  // 2. If paid, auto-provision to school management section immediately
  if (paymentStatus === 'paid') {
    const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
    
    if (lead && lead.status !== 'converted') {
      // Check if school already exists by contact email to avoid duplicates
      const existingSchool = await db.query.schools.findFirst({ 
        where: eq(schools.contactEmail, lead.email) 
      });

      if (!existingSchool) {
        const schoolId = uuidv4();
        
        // Create School
        await db.insert(schools).values({
          id: schoolId,
          name: lead.schoolName,
          address: 'Auto-converted from Sales Payment',
          contactEmail: lead.email,
          subscriptionPlan: lead.plan || 'starter',
          status: 'active'
        });

        // Create Admin User
        await db.insert(users).values({
          uid: uuidv4(),
          email: lead.email,
          role: 'principal',
          schoolId: schoolId,
          status: 'active'
        });

        // Mark lead as converted
        await db.update(leads)
          .set({ status: 'converted' })
          .where(eq(leads.id, id));
      }
    }
  }

  res.status(200).json({ 
    status: 'success', 
    message: paymentStatus === 'paid' ? 'Payment confirmed! School added to management section.' : 'Payment status updated' 
  });
});

/**
 * Razorpay Order Creation
 */
export const createLeadOrder = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { planName } = req.body;

  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  if (!lead) {
    return res.status(404).json({ status: 'error', message: 'Lead not found' });
  }

  // Price mapping (in paise)
  const priceMap: Record<string, number> = {
    'Starter': 499900,
    'Growth': 999900,
    'Pro': 1899900,
    'Elite': 4999900
  };

  const amount = priceMap[planName] || 499900;

  const options = {
    amount,
    currency: 'INR',
    receipt: `receipt_${id.slice(0, 8)}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json({ status: 'success', data: order });
  } catch (error: any) {
    console.error('Razorpay Error:', error);
    
    // If Authentication fails (401) or keys are missing, fallback to Mock Order for development
    if (error.statusCode === 401 || !process.env.RAZORPAY_KEY_ID?.startsWith('rzp_')) {
      console.warn('--- FALLING BACK TO MOCK PAYMENT MODE (DEV ONLY) ---');
      const mockOrder = {
        id: `order_mock_${uuidv4().slice(0, 8)}`,
        amount: amount,
        currency: 'INR',
        receipt: `receipt_${id.slice(0, 8)}`,
        status: 'created',
        mock: true
      };
      return res.status(200).json({ status: 'success', data: mockOrder, isMock: true });
    }
    
    res.status(500).json({ status: 'error', message: 'Failed to create payment order' });
  }
});

/**
 * Razorpay Payment Verification
 */
export const verifyLeadPayment = asyncHandler(async (req: Request, res: Response) => {
  const id = getSingleValue(req.params.id);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;

  if (isMock || razorpay_order_id?.startsWith('order_mock_')) {
    // Skip signature verification for mock orders
    console.log(`[MOCK PAYMENT] Verifying mock order: ${razorpay_order_id}`);
    return await handleSuccessfulProvisioning(id, res);
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    return await handleSuccessfulProvisioning(id, res);
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid payment signature' });
  }
});

/**
 * Shared logic for school provisioning after payment
 */
async function handleSuccessfulProvisioning(id: string, res: Response) {
  await db.update(leads)
    .set({ paymentStatus: 'paid' })
    .where(eq(leads.id, id));

  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  
  if (lead && lead.status !== 'converted') {
    const schoolId = uuidv4();
    
    // Create School
    await db.insert(schools).values({
      id: schoolId,
      name: lead.schoolName,
      address: 'Auto-converted from Sales Payment',
      contactEmail: lead.email,
      subscriptionPlan: lead.plan || 'starter',
      status: 'active'
    });

    // Create Admin User if they don't exist
    const existingUser = await db.query.users.findFirst({ where: eq(users.email, lead.email) });
    if (!existingUser) {
      await db.insert(users).values({
        uid: uuidv4(),
        email: lead.email,
        role: 'principal',
        schoolId: schoolId,
        status: 'active'
      });
    } else {
      console.warn(`User with email ${lead.email} already exists. Linking existing user to new school.`);
      await db.update(users)
        .set({ schoolId, role: 'principal' })
        .where(eq(users.uid, existingUser.uid));
    }

    // Mark lead as converted
    await db.update(leads)
      .set({ status: 'converted' })
      .where(eq(leads.id, id));
  }

  return res.status(200).json({ 
    status: 'success', 
    message: 'Payment verified and school provisioned successfully!' 
  });
}
