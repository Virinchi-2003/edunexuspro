import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using SMTP or Gmail (configurable via env)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, text: string, html?: string) => {
  // Only enter Mock Mode if the password is still the default placeholder
  const isMockMode = !process.env.SMTP_PASS || 
                     process.env.SMTP_PASS === 'your_app_password_here' ||
                     process.env.SMTP_PASS === '';

  if (isMockMode) {
    console.log('--- 📧 SIMULATED EMAIL DISPATCH ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text.substring(0, 100)}...`);
    console.log('------------------------------------');
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"EduNexus Pro Admin" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

export const sendCredentialEmail = async (to: string, schoolName: string, reply: string) => {
  const subject = `Welcome to EduNexus Pro - Credentials for ${schoolName}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #2563eb;">Welcome to EduNexus Pro!</h2>
      <p>Hello,</p>
      <p>Thank you for choosing EduNexus Pro for <strong>${schoolName}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; color: #475569;">Admin Response:</p>
        <p style="margin-top: 10px; color: #1e293b; line-height: 1.6;">${reply}</p>
      </div>
      <p>You can now log in to your portal using the credentials provided above.</p>
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 10px;">
        Login to Portal
      </a>
      <hr style="margin: 30px 0; border: 0; border-top: 1px solid #e2e8f0;" />
      <p style="font-size: 12px; color: #94a3b8;">
        This is an automated message. If you did not request this, please ignore this email.
      </p>
    </div>
  `;
  
  return sendEmail(to, subject, reply, html);
};
