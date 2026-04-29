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
  getExamMarks
} from '../controllers/examController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/school/:schoolId', getExams);
router.post('/', authorize(['admin', 'principal']), createExam);
router.post('/schedule', authorize(['admin', 'principal']), addExamSchedule);
router.delete('/schedule/:id', authorize(['admin', 'principal']), removeExamSchedule);
router.get('/marks/query', getExamMarks);
router.put('/:id', authorize(['admin', 'principal']), updateExam);
router.delete('/:id', authorize(['admin', 'principal']), deleteExam);
router.post('/marks', authorize(['admin', 'principal', 'staff', 'teacher']), enterMarks);
router.get('/report/class/:classId', downloadClassReportCards);
router.get('/download-schedule/:id', downloadExamSchedule);
router.get('/report/hall-tickets/:examId', downloadHallTickets);
router.get('/marks/student/:studentId', getStudentPerformance);
router.get('/report/:studentId', downloadReportCard);

export default router;
