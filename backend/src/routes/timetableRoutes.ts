import { Router } from 'express';
import { 
  createTimetable, 
  getTimetables, 
  updateSlot, 
  deleteSlot,
  getRooms, 
  createRoom 
} from '../controllers/timetableController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/school/:schoolId', authorize(['admin', 'principal', 'staff', 'teacher', 'coach']), getTimetables);
router.post('/', authorize(['admin', 'principal']), createTimetable);
router.post('/slot', authorize(['admin', 'principal', 'coach']), updateSlot);
router.delete('/slot/:id', authorize(['admin', 'principal', 'coach']), deleteSlot);
router.get('/rooms/:schoolId', authorize(['admin', 'principal', 'staff', 'teacher', 'coach']), getRooms);
router.post('/rooms', authorize(['admin', 'principal', 'coach']), createRoom);

export default router;
