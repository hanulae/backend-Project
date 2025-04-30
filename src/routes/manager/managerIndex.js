import express from 'express';
import emailRoutes from './email.js';
import bankRoutes from './bankAccount.js';

const router = express.Router();
router.use('/email', emailRoutes);
router.use('/bank', bankRoutes);

export default router;
