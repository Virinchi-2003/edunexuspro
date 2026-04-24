import { Router } from 'express';
import { createSchool, getSchools, updateSchoolStatus, deleteSchool, updateSchool, syncLeadsToSchools } from '../controllers/schoolController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Only Super Admins can manage schools
router.post('/', authenticate, authorize(['admin']), createSchool);
router.post('/sync', authenticate, authorize(['admin']), syncLeadsToSchools);
router.get('/', authenticate, authorize(['admin']), getSchools);
router.put('/:id/status', authenticate, authorize(['admin']), updateSchoolStatus);
router.put('/:id', authenticate, authorize(['admin']), updateSchool);
router.delete('/:id', authenticate, authorize(['admin']), deleteSchool);

export default router;
