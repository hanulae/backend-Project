import express from 'express';
import managerApprovalRouter from './adminManagerApproval.js';
import funeralApprovalRouter from './adminFuneralApproval.js';
import grantRouter from './adminGrant.js';
import adminCashRefundRequestRouter from './adminCashRefundRequest.js';
import adminUserRouter from './adminUser.js';
import adminAuthRouter from './adminAuth.js';
import adminStaff from './adminStaff.js';
const router = express.Router();

router.use('/manager', managerApprovalRouter);
router.use('/funeral', funeralApprovalRouter);
router.use('/grant', grantRouter);
router.use('/cash', adminCashRefundRequestRouter);
router.use('/user', adminUserRouter);
router.use('/auth', adminAuthRouter);
router.use('/staff', adminStaff);

export default router;
