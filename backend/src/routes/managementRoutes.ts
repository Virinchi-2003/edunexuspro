import { Router } from 'express';
import { 
  createPrincipal, getPrincipals, updatePrincipal, deletePrincipal,
  createSubscription, getSubscriptions, updateSubscription, deleteSubscription,
  getAdminUsers, updateAdminProfile, createNewAdmin, deleteAdminUser,
  updateAdminPassword,
  getSystemStats, getSystemConfig, updateSystemConfig
} from '../controllers/managementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Stats
router.get('/stats', authenticate, authorize(['admin']), getSystemStats);

// Principals
router.post('/principals', authenticate, authorize(['admin']), createPrincipal);
router.get('/principals', authenticate, authorize(['admin']), getPrincipals);
router.put('/principals/:id', authenticate, authorize(['admin']), updatePrincipal);
router.delete('/principals/:id', authenticate, authorize(['admin']), deletePrincipal);

// Subscriptions
router.post('/subscriptions', authenticate, authorize(['admin']), createSubscription);
router.get('/subscriptions', authenticate, authorize(['admin']), getSubscriptions);
router.put('/subscriptions/:id', authenticate, authorize(['admin']), updateSubscription);
router.delete('/subscriptions/:id', authenticate, authorize(['admin']), deleteSubscription);

// System Admins
router.get('/admins', authenticate, authorize(['admin']), getAdminUsers);
router.post('/admins', authenticate, authorize(['admin']), createNewAdmin);
router.put('/admins/:uid', authenticate, authorize(['admin']), updateAdminProfile);
router.put('/admins/:uid/password', authenticate, authorize(['admin']), updateAdminPassword);
router.delete('/admins/:uid', authenticate, authorize(['admin']), deleteAdminUser);

// System Config
router.get('/config', authenticate, authorize(['admin']), getSystemConfig);
router.put('/config', authenticate, authorize(['admin']), updateSystemConfig);

export default router;
