import { Router } from 'express';
import { getStudentDashboardStats } from '../controllers/portalController';
import { getTeachersBySchool } from '../controllers/staffController';
import { getStudentsBySchool } from '../controllers/studentController';
import { 
  getNotifications, 
  submitHomework, 
  getFeeHistory, 
  getConversations, 
  getMessages,
  startConversation,
  sendMessage 
} from '../controllers/parentPortalController';
import { uploadMedia } from '../controllers/mediaController';
import { authenticate, authorize } from '../middleware/auth';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = Router();

router.use(authenticate);

/**
 * Student Portal Dashboard Routes
 */
router.get(
  '/dashboard/:studentId', 
  authorize(['admin', 'principal', 'staff', 'teacher', 'student', 'coach']), 
  getStudentDashboardStats
);

router.get('/teachers/:schoolId', getTeachersBySchool);
router.get('/students-list/:schoolId', getStudentsBySchool);
router.get('/notifications/:userId', getNotifications);
router.post('/homework/submit', submitHomework);
router.get('/fees/history/:studentId', getFeeHistory);
router.get('/conversations/:userId', getConversations);
router.get('/messages/:conversationId', getMessages);
router.post('/conversations/start', startConversation);
router.post('/messages/send', sendMessage);
router.post('/media/upload', upload.single('file'), uploadMedia);

export default router;
