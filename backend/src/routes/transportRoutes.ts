import { Router } from 'express';
import { 
  getBuses, 
  createBus, 
  updateBus, 
  deleteBus,
  getRoutes,
  createRoute,
  createStop,
  updateStop,
  deleteStop,
  assignTransport,
  getUserTransport,
  getAssignments,
  deleteAssignment,
  bulkAssignTransport
} from '../controllers/transportController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Bus CRUD
router.get('/bus/:schoolId', authenticate, getBuses);
router.post('/bus', authenticate, authorize(['admin', 'principal']), createBus);
router.put('/bus/:id', authenticate, authorize(['admin', 'principal']), updateBus);
router.delete('/bus/:id', authenticate, authorize(['admin', 'principal']), deleteBus);

// Route CRUD
router.get('/route/:schoolId', authenticate, getRoutes);
router.post('/route', authenticate, authorize(['admin', 'principal']), createRoute);

// Stop CRUD
router.post('/stop', authenticate, authorize(['admin', 'principal']), createStop);
router.put('/stop/:id', authenticate, authorize(['admin', 'principal']), updateStop);
router.delete('/stop/:id', authenticate, authorize(['admin', 'principal']), deleteStop);

// Assignment
router.post('/assign', authenticate, authorize(['admin', 'principal']), assignTransport);
router.get('/assignments/:schoolId', authenticate, authorize(['admin', 'principal']), getAssignments);
router.delete('/assign/:id', authenticate, authorize(['admin', 'principal']), deleteAssignment);
router.post('/bulk-assign', authenticate, authorize(['admin', 'principal']), bulkAssignTransport);
router.get('/user/:id', authenticate, getUserTransport);

export default router;
