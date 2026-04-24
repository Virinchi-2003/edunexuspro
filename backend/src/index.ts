import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { db } from './config/firebase';

import schoolRoutes from './routes/schoolRoutes';
import managementRoutes from './routes/managementRoutes';
import leadRoutes from './routes/leadRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';

import { initDb } from './config/database';

dotenv.config();

// Initialize Turso
initDb();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://edunexuspro.vercel.app'],
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/schools', schoolRoutes);
app.use('/api/management', managementRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);

// Global Error Handler (must be after routes)
app.use(errorHandler);

// Base Route
app.get('/', (req, res) => {
  res.send('EduNexus Pro API is running...');
});

// Health Check
app.get('/health', async (req, res) => {
  try {
    // Basic Firestore check
    await db.collection('health').doc('status').get();
    res.status(200).json({ status: 'OK', database: 'Connected' });
  } catch (error) {
    res.status(500).json({ status: 'Error', database: 'Disconnected' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
