import { Router } from 'express';
import { 
  getSports,
  addSport,
  updateSport,
  deleteSport,
  getEnrolledStudents,
  getSportsStudents,
  addSkillAssessment,
  addTrainingLog,
  getFixtures,
  addFixture,
  updateFixture,
  deleteFixture,
  getStudentMedicalRecord,
  updateMedicalRecord,
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryTransactions,
  inventoryCheckout,
  inventoryCheckin,
  addSportsStudent,
  enrollExistingStudent,
  updateSportsStudent,
  unenrollStudent,
  getSchoolStudents,
  getTrophies,
  addTrophy,
  deleteTrophy,
  getCoachDashboardStats,
  getRecentAssessments,
  getTrainingLoadAnalysis,
  getRequisitions,
  addRequisition,
  updateRequisition,
  deleteRequisition
} from '../controllers/coachController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.use(authorize(['admin', 'principal', 'coach']));

// --- Sports Programs ---
router.get('/sports/:schoolId', getSports);
router.post('/sports', addSport);
router.put('/sports/:id', updateSport);
router.delete('/sports/:id', deleteSport);

// --- Students & Enrollment ---
router.get('/enrolled-students/:schoolId', getEnrolledStudents);
router.get('/students/:sportId/:schoolId', getSportsStudents); // corrected
router.get('/school-students/:schoolId', getSchoolStudents);
router.post('/students', addSportsStudent);
router.post('/students/enroll', enrollExistingStudent);
router.put('/students/:id', updateSportsStudent);
router.delete('/students/:studentId/enrollment/:sportId', unenrollStudent);

// --- Analytics ---
router.get('/dashboard-stats/:schoolId', getCoachDashboardStats);
router.get('/analytics/recent-assessments/:schoolId', getRecentAssessments);
router.get('/analytics/training-load/:schoolId', getTrainingLoadAnalysis);
router.post('/assessment', addSkillAssessment);
router.post('/training-log', addTrainingLog);

// --- Fixtures ---
router.get('/fixtures/:schoolId', getFixtures);
router.post('/fixtures', addFixture);
router.put('/fixtures/:id', updateFixture);
router.delete('/fixtures/:id', deleteFixture);

// --- Trophies ---
router.get('/trophies/:schoolId', getTrophies);
router.post('/trophies', addTrophy);
router.delete('/trophies/:id', deleteTrophy);

// --- Inventory ---
router.get('/inventory/:schoolId', getInventory);
router.post('/inventory', addInventoryItem);
router.put('/inventory/:id', updateInventoryItem);
router.delete('/inventory/:id', deleteInventoryItem);
router.get('/inventory-transactions/:schoolId', getInventoryTransactions);
router.post('/inventory/checkout', inventoryCheckout);
router.post('/inventory/checkin', inventoryCheckin);

// --- Medical ---
router.get('/medical/:studentId', getStudentMedicalRecord);
router.put('/medical/:studentId', updateMedicalRecord);

// --- Requisitions ---
router.get('/requisitions/:schoolId', getRequisitions);
router.post('/requisitions', addRequisition);
router.put('/requisitions/:id', updateRequisition);
router.delete('/requisitions/:id', deleteRequisition);

export default router;
