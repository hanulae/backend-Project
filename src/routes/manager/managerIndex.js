import express from 'express';
import emailRoutes from './email.js';
import bankRoutes from './bankAccount.js';
import userRoutes from './managerUser.js';
import authRoutes from './managerAuth.js';
import funeralInfoRoutes from './funeralInfoRoutes.js';
import pointRoutes from './managerPoint.js';
import cashRoutes from './managerCash.js';
import smsRoutes from './managerSMS.js';

const router = express.Router();
router.use('/email', emailRoutes);
router.use('/bank', bankRoutes);
router.use('/user', userRoutes);
router.use('/auth', authRoutes);
router.use('/funeral', funeralInfoRoutes);
router.use('/point', pointRoutes);
router.use('/cash', cashRoutes);
router.use('/sms', smsRoutes);

export default router;
