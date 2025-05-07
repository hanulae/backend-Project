import express from 'express';
import emailRoutes from './email.js';
import bankRoutes from './bankAccount.js';
import userRoutes from './managerUser.js';
import authRoutes from './managerAuth.js';

const router = express.Router();
router.use('/email', emailRoutes);
router.use('/bank', bankRoutes);
router.use('/user', userRoutes);
router.use('/auth', authRoutes);

export default router;
