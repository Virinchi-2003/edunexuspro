import { Router } from 'express';
import { login, changePassword, updateProfile } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/change-password', changePassword);
router.put('/profile/:uid', updateProfile);

export default router;
