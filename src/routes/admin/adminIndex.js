import express from 'express';
import managerApprovalRouter from './adminManagerApproval.js';
import funeralApprovalRouter from './adminFuneralApproval.js';

const router = express.Router();

router.use('/manager', managerApprovalRouter);
router.use('/funeral', funeralApprovalRouter);

router.get('/', (req, res) => {
  res.send('안녕하세요');
});

export default router;
