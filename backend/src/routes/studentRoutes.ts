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
  applyLeave,
  getStudentQR
} from '../controllers/studentController';
import { 
  getStudentHomeworkList, 
  submitHomework 
} from '../controllers/homeworkController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/school/:schoolId', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), getStudentsBySchool);
router.get('/class/:classId', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), getStudentsByClass);
router.post('/multiple-classes', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), getStudentsByMultipleClasses);
router.get('/user/:userId', getStudentByUser);
router.get('/homework/:classId', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), getStudentHomework);
router.get('/leave/:studentId', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), getStudentLeaves);
router.post('/leave', applyLeave);
router.get('/:studentId/qr', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), getStudentQR);

// Homework
router.get('/homework-list/:classId', authorize(['student']), getStudentHomeworkList);
router.post('/homework/submit', authorize(['student']), submitHomework);
router.post('/', authorize(['admin', 'principal', 'staff', 'teacher']), createStudent);
router.post('/bulk', authorize(['admin', 'principal', 'staff', 'teacher']), bulkCreateStudents);
router.put('/:id', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), updateStudent);
router.delete('/:id', authorize(['admin', 'principal', 'staff', 'teacher']), deleteStudent);

export default router;
