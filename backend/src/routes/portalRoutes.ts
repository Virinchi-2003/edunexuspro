import { Router } from 'express';
import { getStudentDashboardStats } from '../controllers/portalController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/dashboard/:studentId', authenticate, authorize(['admin', 'principal', 'staff', 'teacher', 'student']), getStudentDashboardStats);

export default router;
