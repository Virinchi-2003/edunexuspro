import { Router } from 'express';
import { 
  getStudentsBySchool, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  bulkCreateStudents 
} from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal']), getStudentsBySchool);
router.post('/', authenticate, authorize(['admin', 'principal']), createStudent);
router.post('/bulk', authenticate, authorize(['admin', 'principal']), bulkCreateStudents);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateStudent);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteStudent);

export default router;
