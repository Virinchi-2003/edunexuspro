import { Router } from 'express';
import { createSchool, getSchools, getSchoolById, updateSchoolStatus, deleteSchool, updateSchool, syncLeadsToSchools, getPublicSchools } from '../controllers/schoolController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/public', getPublicSchools);

// Only Super Admins can manage schools
router.post('/', authenticate, authorize(['admin']), createSchool);
router.post('/sync', authenticate, authorize(['admin']), syncLeadsToSchools);
router.get('/', authenticate, authorize(['admin']), getSchools);
router.get('/:id', authenticate, authorize(['admin', 'principal']), getSchoolById);
router.put('/:id/status', authenticate, authorize(['admin']), updateSchoolStatus);
router.put('/:id', authenticate, authorize(['admin']), updateSchool);
router.delete('/:id', authenticate, authorize(['admin']), deleteSchool);

export default router;
