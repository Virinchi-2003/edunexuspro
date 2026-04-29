import { Router } from 'express';
import { getStudentDashboardStats } from '../controllers/portalController';
import { 
  getNotifications, 
  submitHomework, 
  getFeeHistory, 
  getConversations, 
  sendMessage 
} from '../controllers/parentPortalController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * Student Portal Dashboard Routes
 */
router.get(
  '/dashboard/:studentId', 
  authorize(['admin', 'principal', 'staff', 'teacher', 'student']), 
  getStudentDashboardStats
);

router.get('/notifications/:userId', getNotifications);
router.post('/homework/submit', submitHomework);
router.get('/fees/history/:studentId', getFeeHistory);
router.get('/conversations/:userId', getConversations);
router.post('/messages/send', sendMessage);

export default router;
