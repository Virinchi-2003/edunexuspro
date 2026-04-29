import { Router } from 'express';
import { 
  getClassesBySchool, 
  createClass, 
  updateClass, 
  deleteClass 
} from '../controllers/classController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/school/:schoolId', authenticate, authorize(['admin', 'principal', 'staff', 'teacher']), getClassesBySchool);
router.post('/', authenticate, authorize(['admin', 'principal']), createClass);
router.put('/:id', authenticate, authorize(['admin', 'principal']), updateClass);
router.delete('/:id', authenticate, authorize(['admin', 'principal']), deleteClass);

export default router;
