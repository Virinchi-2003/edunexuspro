import { Router } from 'express';
import { 
  getStaffBySchool, 
  createStaff, 
  updateStaff, 
  deleteStaff 
} from '../controllers/staffController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal']), getStaffBySchool);
router.post('/', authenticate, authorize(['admin', 'principal']), createStaff);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateStaff);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteStaff);

export default router;
