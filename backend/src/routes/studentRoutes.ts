import { Router } from 'express';
import { 
  getStudentsBySchool, 
  getStudentsByClass,
  getStudentsByMultipleClasses,
  createStudent, 
  updateStudent, 
  deleteStudent,
  bulkCreateStudents,
  getStudentByUser,
  getStudentHomework,
  getStudentLeaves,
  applyLeave
} from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/school/:schoolId', authorize(['admin', 'principal', 'staff']), getStudentsBySchool);
router.get('/class/:classId', authorize(['admin', 'principal', 'staff']), getStudentsByClass);
router.post('/multiple-classes', authorize(['admin', 'principal', 'staff']), getStudentsByMultipleClasses);
router.get('/user/:userId', getStudentByUser);
router.get('/homework/:classId', getStudentHomework);
router.get('/leave/:studentId', getStudentLeaves);
router.post('/leave', applyLeave);
router.post('/', authorize(['admin', 'principal', 'staff']), createStudent);
router.post('/bulk', authorize(['admin', 'principal', 'staff']), bulkCreateStudents);
router.put('/:id', authorize(['admin', 'principal', 'staff']), updateStudent);
router.delete('/:id', authorize(['admin', 'principal', 'staff']), deleteStudent);

export default router;
