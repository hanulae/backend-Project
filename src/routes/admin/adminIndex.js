import express from 'express';
import managerApprovalRouter from './adminManagerApproval.js';
import funeralApprovalRouter from './adminFuneralApproval.js';
import grantRouter from './adminGrantRoute.js';

const router = express.Router();

router.use('/manager', managerApprovalRouter);
router.use('/funeral', funeralApprovalRouter);
router.use('/grant', grantRouter);

export default router;
