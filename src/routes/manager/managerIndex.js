import express from 'express';
import managerFormRoutes from './managerForm.js';
import managerCartRoutes from './managerCart.js';
import dispatchRequest from './managerDispatchRequest.js';
import emailRoutes from './managerEmail.js';
import bankRoutes from './managerBankAccount.js';
import userRoutes from './managerUser.js';
import authRoutes from './managerAuth.js';
import funeralListRoutes from './managerFuneralList.js';
import pointRoutes from './managerPoint.js';
import cashRoutes from './managerCash.js';
import smsRoutes from './managerSMS.js';

const router = express.Router();

router.use('/email', emailRoutes);
router.use('/bank', bankRoutes);
router.use('/form', managerFormRoutes);
router.use('/cart', managerCartRoutes);
router.use('/request', dispatchRequest);
router.use('/user', userRoutes);
router.use('/auth', authRoutes);
router.use('/funeral', funeralListRoutes);
router.use('/point', pointRoutes);
router.use('/cash', cashRoutes);
router.use('/sms', smsRoutes);

export default router;
