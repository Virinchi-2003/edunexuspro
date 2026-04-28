import { Router } from 'express';
import { 
  createAdmission, 
  getAdmissionsBySchool, 
  updateAdmissionStatus 
} from '../controllers/admissionController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public route for students to apply
router.post('/', createAdmission);

// Protected routes for principals
router.get('/school/:schoolId', authenticate, authorize(['principal', 'admin']), getAdmissionsBySchool);
router.put('/:id/status', authenticate, authorize(['principal', 'admin']), updateAdmissionStatus);

export default router;
