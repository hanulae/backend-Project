import express from 'express';
import emailRoutes from './email.js';
import bankRoutes from './bankAccount.js';
import managerFormRoutes from './managerForm.js';
import managerCartRoutes from './managerCart.js';
import dispatchRequest from './dispatchRequest.js';

const router = express.Router();

router.use('/email', emailRoutes);
router.use('/bank', bankRoutes);
router.use('/form', managerFormRoutes);
router.use('/cart', managerCartRoutes);
router.use('/request', dispatchRequest);

export default router;
