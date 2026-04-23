import { Router } from 'express';
import { createSchool, getSchools } from '../controllers/schoolController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only Super Admins can manage schools
router.post('/', authenticate, authorize(['admin']), createSchool);
router.get('/', authenticate, authorize(['admin']), getSchools);

export default router;
