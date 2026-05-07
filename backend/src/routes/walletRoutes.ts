import { Router } from 'express';
import { 
  getWallet, 
  getTransactions, 
  topupWallet, 
  processPayment, 
  setWalletLimits, 
  toggleWalletStatus,
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/walletController';
import { authenticate, authorize, checkPlan } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(checkPlan('ELITE'));

router.get('/:studentId', getWallet);
router.get('/transactions/:studentId', getTransactions);
router.post('/topup', authorize(['parent', 'admin', 'student']), topupWallet);
router.post('/razorpay/create-order', authorize(['parent', 'student']), createRazorpayOrder);
router.post('/razorpay/verify', authorize(['parent', 'student']), verifyRazorpayPayment);
router.post('/pay', authorize(['vendor', 'staff', 'admin']), processPayment);
router.post('/set-limits', authorize(['parent', 'admin']), setWalletLimits);
router.post('/toggle-status', authorize(['parent', 'admin']), toggleWalletStatus);

export default router;
