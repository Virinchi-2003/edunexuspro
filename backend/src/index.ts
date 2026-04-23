import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { db } from './config/firebase';

import schoolRoutes from './routes/schoolRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/schools', schoolRoutes);

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
