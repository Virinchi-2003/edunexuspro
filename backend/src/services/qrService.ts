import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'edunexus_secure_qr_secret_2026';

export const generateStudentQRToken = (studentId: string) => {
  // Generate a token that expires in 24 hours to keep it secure
  // For static ID cards, you might want a longer expiration or no expiration
  return jwt.sign({ studentId, type: 'STUDENT_ATTENDANCE' }, JWT_SECRET, { expiresIn: '1y' });
};

export const verifyStudentQRToken = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type === 'STUDENT_ATTENDANCE') {
      return decoded.studentId;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const generateQRCodeDataURL = async (data: string) => {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#4f46e5', // Indigo color matching theme
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('QR Generation Error:', err);
    throw err;
  }
};
