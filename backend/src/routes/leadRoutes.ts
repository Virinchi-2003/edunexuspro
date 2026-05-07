import { Router } from 'express';
import { 
  createLead, 
  getLeads, 
  updateLeadStatus, 
  replyToLead, 
  updatePaymentStatus,
  createLeadOrder,
  verifyLeadPayment
} from '../controllers/leadController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public route for contacting sales
router.post('/', createLead);
router.post('/:id/order', createLeadOrder);
router.post('/:id/verify', verifyLeadPayment);
router.put('/:id/pay', updatePaymentStatus); // Public for simulation

// Protected routes for admins to manage leads
router.get('/', authenticate, authorize(['admin']), getLeads);
router.put('/:id/status', authenticate, authorize(['admin']), updateLeadStatus);
router.put('/:id/payment', authenticate, authorize(['admin']), updatePaymentStatus); // Admin update
router.post('/:id/reply', authenticate, authorize(['admin']), replyToLead);

export default router;
