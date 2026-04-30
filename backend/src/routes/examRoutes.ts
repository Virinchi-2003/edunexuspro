import { Router } from 'express';
import { 
  createExam,
  getExams,
  addExamSchedule, 
  removeExamSchedule,
  enterMarks, 
  downloadReportCard,
  downloadClassReportCards,
  downloadHallTickets,
  getStudentPerformance,
  updateExam,
  deleteExam,
  downloadExamSchedule,
  getExamMarks,
  downloadGradebook
} from '../controllers/examController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/school/:schoolId', authorize(['admin', 'principal', 'staff', 'teacher']), getExams);
router.post('/', authorize(['admin', 'principal']), createExam);
router.post('/schedule', authorize(['admin', 'principal']), addExamSchedule);
router.delete('/schedule/:id', authorize(['admin', 'principal']), removeExamSchedule);
router.get('/marks/query', authorize(['admin', 'principal', 'staff', 'teacher']), getExamMarks);
router.put('/:id', authorize(['admin', 'principal']), updateExam);
router.delete('/:id', authorize(['admin', 'principal']), deleteExam);
router.post('/marks', authorize(['admin', 'principal', 'staff', 'teacher']), enterMarks);
router.get('/report/class/:classId', downloadClassReportCards);
router.get('/report/gradebook', authorize(['admin', 'principal', 'staff', 'teacher']), downloadGradebook);
router.get('/download-schedule/:id', downloadExamSchedule);
router.get('/report/hall-tickets/:examId', downloadHallTickets);
router.get('/marks/student/:studentId', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), getStudentPerformance);
router.get('/report/:studentId', authorize(['admin', 'principal', 'staff', 'teacher', 'student']), downloadReportCard);

export default router;
