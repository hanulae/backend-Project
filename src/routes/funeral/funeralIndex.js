import express from 'express';
import managerFormByFuneral from './managerFormByFuneral.js';
import funeralInfo from './funeralInfo.js';

const router = express.Router();

router.use('/form', managerFormByFuneral);
router.use('/room', funeralInfo);

export default router;
