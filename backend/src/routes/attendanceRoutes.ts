import { Router } from 'express';
import { getAttendance, markAttendance, updateAttendance, deleteAttendance, sendAlerts, generateReport, getStudentAttendance } from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal', 'teacher']), getAttendance);
router.get('/student/:studentId', authenticate, getStudentAttendance);
router.post('/mark', authenticate, authorize(['admin', 'principal', 'teacher']), markAttendance);
router.post('/send-alerts', authenticate, authorize(['admin', 'principal']), sendAlerts);
router.post('/report', authenticate, authorize(['admin', 'principal']), generateReport);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateAttendance);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteAttendance);

export default router;
