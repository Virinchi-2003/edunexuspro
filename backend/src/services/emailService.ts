import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'mock-user',
    pass: process.env.SMTP_PASS || 'mock-pass',
  },
});

export const sendAdmissionEmail = async (
  to: string, 
  studentName: string, 
  status: 'approved' | 'rejected',
  details?: { studentId?: string; schoolName?: string }
) => {
  const isApproved = status === 'approved';
  
  const subject = isApproved 
    ? `Congratulations! Admission Approved for ${studentName}`
    : `Admission Application Update for ${studentName}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'};">${subject}</h2>
      <p>Dear Parent,</p>
      <p>We are ${isApproved ? 'pleased' : 'writing'} to inform you that the admission application for <strong>${studentName}</strong> has been <strong>${status}</strong> by ${details?.schoolName || 'the school administration'}.</p>
      
      ${isApproved ? `
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #64748b; font-size: 14px;">Your child's unique Student ID is:</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #2563eb;">${details?.studentId}</p>
          <p style="margin: 15px 0 0 0; font-size: 14px; color: #64748b;">You can now use this ID to log in to the student portal.</p>
        </div>
      ` : `
        <p>If you have any questions regarding this decision, please contact the school administration directly.</p>
      `}
      
      <p style="margin-top: 30px;">Best regards,<br/>EduNexus Pro Team</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated message from EduNexus Pro. Please do not reply.</p>
    </div>
  `;

  try {
    // If running in development without real SMTP, we just log it
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'mock-user') {
      console.log('--- SIMULATED EMAIL SENT ---');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Status:', status);
      console.log('----------------------------');
      return { success: true, message: 'Email simulated' };
    }

    await transporter.sendMail({
      from: '"EduNexus Pro" <noreply@edunexuspro.com>',
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
};
