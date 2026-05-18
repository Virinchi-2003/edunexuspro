import { Router } from 'express';
import { 
  createPrincipal, getPrincipals, updatePrincipal, deletePrincipal,
  createSubscription, getSubscriptions, updateSubscription, deleteSubscription,
  getAdminUsers, updateAdminProfile, createNewAdmin, deleteAdmin,
  changeAdminPassword,
  getSystemStats, getSchoolStats, getSystemConfig, updateSystemConfig,
  getSchoolPayments, createSchoolPayment, deleteSchoolPayment,
  sendRepaymentReminder, getRepaymentReminders, resolveRepaymentReminder
} from '../controllers/managementController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Stats
router.get('/stats', authenticate, authorize(['admin']), getSystemStats);
router.get('/school-stats/:schoolId', authenticate, authorize(['admin', 'principal']), getSchoolStats);

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

// School Payments
router.get('/payments', authenticate, authorize(['admin']), getSchoolPayments);
router.post('/payments', authenticate, authorize(['admin']), createSchoolPayment);
router.delete('/payments/:id', authenticate, authorize(['admin']), deleteSchoolPayment);

// Repayment Reminders
router.post('/payments/remind', authenticate, authorize(['admin']), sendRepaymentReminder);
router.get('/payments/reminders/:schoolId', authenticate, getRepaymentReminders);
router.post('/payments/reminders/:id/resolve', authenticate, resolveRepaymentReminder);

// System Admins
router.get('/admins', authenticate, authorize(['admin']), getAdminUsers);
router.post('/admins', authenticate, authorize(['admin']), createNewAdmin);
router.put('/admins/:uid', authenticate, authorize(['admin']), updateAdminProfile);
router.put('/admins/:uid/password', authenticate, authorize(['admin']), changeAdminPassword);
router.delete('/admins/:uid', authenticate, authorize(['admin']), deleteAdmin);

// System Config
router.get('/config', authenticate, authorize(['admin']), getSystemConfig);
router.put('/config', authenticate, authorize(['admin']), updateSystemConfig);

export default router;
