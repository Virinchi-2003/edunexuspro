import { Router } from 'express';
import { 
  getFeesBySchool, 
  updateFeeStatus, 
  createFeeRecord,
  importBulkFees,
  deleteFeeRecord,
  sendFeeReminders,
  getStudentFees,
  downloadFeeReceipt,
  createRazorpayOrder,
  verifyPayment
} from '../controllers/feesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student-specific routes
router.get('/student/:studentId', authenticate, authorize(['student', 'parent', 'admin', 'principal']), getStudentFees);
router.get('/receipt/:transactionId', authenticate, downloadFeeReceipt);

// Razorpay routes
router.post('/razorpay/order', authenticate, createRazorpayOrder);
router.post('/razorpay/verify', authenticate, verifyPayment);

// Management routes
router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal', 'staff', 'teacher']), getFeesBySchool);
router.post('/', authenticate, authorize(['admin', 'principal']), createFeeRecord);
router.post('/bulk', authenticate, authorize(['admin', 'principal']), importBulkFees);
router.post('/reminders', authenticate, authorize(['admin', 'principal']), sendFeeReminders);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateFeeStatus);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteFeeRecord);

export default router;
