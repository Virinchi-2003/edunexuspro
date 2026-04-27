import { Request, Response } from 'express';
import { db } from '../config/database';
import { leads, schools, users } from '../db/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { sendCredentialEmail } from '../utils/mail';
import { getSingleValue } from '../utils/queryHelper';

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

      // Create primary Admin User
      await db.insert(users).values({
        uid: uuidv4(),
        email: lead.email,
        role: 'principal',
        schoolId: schoolId,
        status: 'active'
      });
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
