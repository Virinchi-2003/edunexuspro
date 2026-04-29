import { Router } from 'express';
import { 
  getAttendance, 
  markAttendance, 
  updateAttendance, 
  deleteAttendance, 
  sendAlerts, 
  generateReport, 
  getStudentAttendance,
  getStaffAttendance,
  getAttendanceByClass,
  markAttendanceByQR
} from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal', 'staff', 'teacher']), getAttendance);
router.get('/class/:schoolId/:classId', authenticate, authorize(['admin', 'principal', 'staff', 'teacher']), getAttendanceByClass);
router.get('/student/:studentId', authenticate, getStudentAttendance);
router.get('/staff/:staffId', authenticate, getStaffAttendance);
router.post('/mark', authenticate, authorize(['admin', 'principal', 'staff', 'teacher']), markAttendance);
router.post('/qr', authenticate, authorize(['admin', 'principal', 'staff', 'teacher']), markAttendanceByQR);
router.post('/send-alerts', authenticate, authorize(['admin', 'principal']), sendAlerts);
router.post('/report', authenticate, authorize(['admin', 'principal']), generateReport);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateAttendance);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteAttendance);

export default router;
