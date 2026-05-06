import { Router } from 'express';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../controllers/announcementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/:schoolId', getAnnouncements);
router.post('/', authorize(['admin', 'principal']), createAnnouncement);
router.delete('/:id', authorize(['admin', 'principal']), deleteAnnouncement);

export default router;
