import { Router } from 'express';
import { 
  createTimetable, 
  getTimetables, 
  updateSlot, 
  getRooms, 
  createRoom 
} from '../controllers/timetableController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/school/:schoolId', getTimetables);
router.post('/', authorize(['admin', 'principal']), createTimetable);
router.post('/slot', authorize(['admin', 'principal']), updateSlot);
router.get('/rooms/:schoolId', getRooms);
router.post('/rooms', authorize(['admin', 'principal']), createRoom);

export default router;
