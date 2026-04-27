import { Router } from 'express';
import { 
  getFeesBySchool, 
  updateFeeStatus, 
  createFeeRecord,
  importBulkFees,
  deleteFeeRecord,
  sendFeeReminders
} from '../controllers/feesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal']), getFeesBySchool);
router.post('/', authenticate, authorize(['admin', 'principal']), createFeeRecord);
router.post('/bulk', authenticate, authorize(['admin', 'principal']), importBulkFees);
router.post('/reminders', authenticate, authorize(['admin', 'principal']), sendFeeReminders);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateFeeStatus);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteFeeRecord);

export default router;
