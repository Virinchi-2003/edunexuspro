import { Router } from 'express';
import { 
  applyLeave, 
  getStudentLeaves, 
  getTeacherLeaves, 
  updateLeaveStatus,
  getAllLeaves
} from '../controllers/leaveController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Student
router.post('/apply', authorize(['student']), applyLeave);
router.get('/student/:studentId', authorize(['admin', 'principal', 'staff', 'teacher', 'student', 'coach', 'parent']), getStudentLeaves);

// Teacher/Staff
router.get('/teacher/:staffId', authorize(['admin', 'principal', 'staff', 'teacher', 'coach']), getTeacherLeaves);
router.put('/update/:leaveId', authorize(['admin', 'principal', 'staff', 'teacher', 'coach']), updateLeaveStatus);

// Admin/All
router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal', 'teacher', 'staff']), getAllLeaves);

export default router;
