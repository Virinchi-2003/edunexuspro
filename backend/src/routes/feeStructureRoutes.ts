import { Router } from 'express';
import { getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure } from '../controllers/feeController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal', 'teacher', 'staff', 'student']), getFeeStructures);
router.post('/', authenticate, authorize(['admin', 'principal']), createFeeStructure);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateFeeStructure);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteFeeStructure);

export default router;
