import { Router } from 'express';
import { 
  getStaffBySchool, 
  getStaffByUserId,
  createStaff, 
  updateStaff, 
  deleteStaff,
  assignClasses,
  getTeacherClasses,
  getTeacherDashboardStats,
  getLeavesByTeacher,
  updateLeaveStatus
} from '../controllers/staffController';
import { 
  createHomework, 
  getTeacherHomework, 
  updateHomework, 
  deleteHomework, 
  getHomeworkSubmissions, 
  gradeHomework 
} from '../controllers/homeworkController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal']), getStaffBySchool);
router.get('/user/:userId', authenticate, authorize(['admin', 'principal', 'staff', 'teacher']), getStaffByUserId);
router.get('/my-classes/:teacherId', authenticate, authorize(['teacher', 'staff']), getTeacherClasses);
router.get('/dashboard-stats/:staffId', authenticate, authorize(['teacher', 'staff']), getTeacherDashboardStats);
router.post('/assign-classes', authenticate, authorize(['admin', 'principal']), assignClasses);
router.post('/', authenticate, authorize(['admin', 'principal']), createStaff);
router.get('/leaves/:staffId', authenticate, authorize(['teacher', 'staff']), getLeavesByTeacher);
router.post('/leaves/status', authenticate, authorize(['teacher', 'staff']), updateLeaveStatus);

// Homework Management
router.post('/homework', authenticate, authorize(['teacher', 'staff']), createHomework);
router.get('/homework/:teacherId', authenticate, authorize(['teacher', 'staff']), getTeacherHomework);
router.put('/homework/:id', authenticate, authorize(['teacher', 'staff']), updateHomework);
router.delete('/homework/:id', authenticate, authorize(['teacher', 'staff']), deleteHomework);
router.get('/homework/submissions/:homeworkId', authenticate, authorize(['teacher', 'staff']), getHomeworkSubmissions);
router.post('/homework/grade/:submissionId', authenticate, authorize(['teacher', 'staff']), gradeHomework);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateStaff);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteStaff);

export default router;
