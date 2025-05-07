import express from 'express';
import emailRoutes from './email.js';
import bankRoutes from './bankAccount.js';
import userRoutes from './managerUser.js';

const router = express.Router();
router.use('/email', emailRoutes);
router.use('/bank', bankRoutes);
router.use('/user', userRoutes);

export default router;
