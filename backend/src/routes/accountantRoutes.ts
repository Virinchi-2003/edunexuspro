import { Router } from 'express';
import { 
  getFinancialStats,
  getSalaryRecords,
  processSalaryPayment,
  getSalaryHistory,
  getSupportTickets,
  updateTicketStatus,
  getAccountantRequisitions,
  updateRequisitionStatus,
  sendCustomFeeReminder
} from '../controllers/accountantController';
import { getFeesBySchool, updateFeeStatus, createFeeRecord, sendFeeReminders } from '../controllers/feesController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize(['admin', 'principal', 'accountant']));

// --- Financial Dashboard ---
router.get('/stats/:schoolId', getFinancialStats);

// --- Fee Management (Shared/Reused) ---
router.get('/fees/:schoolId', getFeesBySchool);
router.post('/fees/record', createFeeRecord);
router.put('/fees/:id', updateFeeStatus);
router.post('/fees/reminders', sendFeeReminders);
router.post('/fees/custom-reminder', sendCustomFeeReminder);

// --- Salary Management ---
router.get('/salaries/records/:schoolId', getSalaryRecords);
router.post('/salaries/pay', processSalaryPayment);
router.get('/salaries/history/:schoolId', getSalaryHistory);

// --- Support / Helpdesk ---
router.get('/tickets/:schoolId', getSupportTickets);
router.put('/tickets/:id', updateTicketStatus);

// --- Procurement / Requisitions ---
router.get('/requisitions/:schoolId', getAccountantRequisitions);
router.put('/requisitions/:id', updateRequisitionStatus);

export default router;
