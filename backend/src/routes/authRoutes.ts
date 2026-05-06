import { Router } from 'express';
import { login, changePassword, updateProfile, forgotPassword, resetPassword } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/change-password', changePassword);
router.put('/profile/:uid', updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
