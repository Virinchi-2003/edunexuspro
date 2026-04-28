import { Router } from 'express';
import { 
  getStudentsBySchool, 
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

router.get('/school/:schoolId', authorize(['admin', 'principal']), getStudentsBySchool);
router.get('/user/:userId', getStudentByUser);
router.get('/homework/:classId', getStudentHomework);
router.get('/leave/:studentId', getStudentLeaves);
router.post('/leave', applyLeave);
router.post('/', authorize(['admin', 'principal']), createStudent);
router.post('/bulk', authorize(['admin', 'principal']), bulkCreateStudents);
router.put('/:id', authorize(['admin', 'principal']), updateStudent);
router.delete('/:id', authorize(['admin', 'principal']), deleteStudent);

export default router;
