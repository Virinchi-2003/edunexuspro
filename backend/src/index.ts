import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDb, turso } from './config/database';

import schoolRoutes from './routes/schoolRoutes';
import managementRoutes from './routes/managementRoutes';
import leadRoutes from './routes/leadRoutes';
import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import classRoutes from './routes/classRoutes';
import staffRoutes from './routes/staffRoutes';
import feesRoutes from './routes/feesRoutes';
import feeStructureRoutes from './routes/feeStructureRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import admissionRoutes from './routes/admissionRoutes';
import timetableRoutes from './routes/timetableRoutes';
import examRoutes from './routes/examRoutes';
import coachRoutes from './routes/coachRoutes';
import portalRoutes from './routes/portalRoutes';
import accountantRoutes from './routes/accountantRoutes';
import announcementRoutes from './routes/announcementRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

// Initialize Turso
initDb();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'https://edunexuspro.vercel.app',
    'https://edunexuspro-1.onrender.com',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/schools', schoolRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/student', studentRoutes); // Alias for legacy/singular calls
app.use('/api/classes', classRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/announcements', announcementRoutes);

// Global Error Handler (must be after routes)
app.use(errorHandler);

// Base Route
app.get('/', (req, res) => {
  res.send('EduNexus Pro API is running...');
});

// Health Check
app.get('/health', async (req, res) => {
  try {
    // Basic Turso check
    await turso.execute('SELECT 1');
    res.status(200).json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
