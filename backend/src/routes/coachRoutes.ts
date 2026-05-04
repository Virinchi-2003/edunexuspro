import { Router } from 'express';
import { 
  getSports,
  getEnrolledStudents,
  createSkillAssessment,
  getStudentSkillHistory,
  createTrainingLog,
  getFixtures,
  updateFixtureResult,
  getStudentMedicalRecord,
  updateMedicalRecord,
  getInventory,
  inventoryCheckout,
  inventoryCheckin
} from '../controllers/coachController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['admin', 'principal', 'coach']));

router.get('/sports/:schoolId', getSports);
router.get('/students/:sportId', getEnrolledStudents);
router.post('/assessment', createSkillAssessment);
router.get('/assessment/history/:studentId', getStudentSkillHistory);
router.post('/training-log', createTrainingLog);
router.get('/fixtures/:schoolId', getFixtures);
router.put('/fixtures/:id', updateFixtureResult);
router.get('/medical/:studentId', getStudentMedicalRecord);
router.put('/medical/:studentId', updateMedicalRecord);
router.get('/inventory/:schoolId', getInventory);
router.post('/inventory/checkout', inventoryCheckout);
router.post('/inventory/checkin', inventoryCheckin);

export default router;
