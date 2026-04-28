import { Router } from 'express';
import { 
  getDashboardStats, 
  getNotifications, 
  submitHomework, 
  getFeeHistory, 
  getConversations, 
  sendMessage 
} from '../controllers/parentPortalController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// B1 Dashboard
router.get('/dashboard/:studentId', getDashboardStats);
router.get('/notifications/:userId', getNotifications);

// B2 Homework
router.post('/homework/submit', submitHomework);

// B4 Fees
router.get('/fees/history/:studentId', getFeeHistory);

// B5 Communication
router.get('/conversations/:userId', getConversations);
router.post('/messages/send', sendMessage);

export default router;
