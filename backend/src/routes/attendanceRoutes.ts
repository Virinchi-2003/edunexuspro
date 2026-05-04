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
  markAttendanceByQR,
  getMonthlyAttendanceStats
} from '../controllers/attendanceController';

import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal', 'staff', 'teacher', 'coach']), getAttendance);
router.get('/class/:schoolId/:classId', authenticate, authorize(['admin', 'principal', 'staff', 'teacher', 'coach']), getAttendanceByClass);
router.get('/student/:studentId', authenticate, getStudentAttendance);
router.get('/staff/:staffId', authenticate, getStaffAttendance);
router.get('/stats/:schoolId', authenticate, authorize(['admin', 'principal']), getMonthlyAttendanceStats);
router.post('/mark', authenticate, authorize(['admin', 'principal', 'staff', 'teacher', 'coach']), markAttendance);
router.post('/qr', authenticate, authorize(['admin', 'principal', 'staff', 'teacher', 'coach']), markAttendanceByQR);
router.post('/send-alerts', authenticate, authorize(['admin', 'principal']), sendAlerts);
router.post('/report', authenticate, authorize(['admin', 'principal']), generateReport);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateAttendance);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteAttendance);

export default router;
