import express from 'express';
import managerFormByFuneral from './managerFormByFuneral.js';
import funeralHallInfo from './funeralHallInfo.js';
import funeralAuth from './funeralAuth.js';
import funeralEmail from './funeralEmail.js';
import funeralSMS from './funeralSMS.js';
import funeralAccount from './funeralAccount.js';
import funeralUser from './funeralUser.js';
import funeralStaff from './funeralStaff.js';
import funeralCash from './funeralCash.js';
import funeralDispatchRequest from './funeralDispatchRequest.js';

const router = express.Router();

router.use('/auth', funeralAuth);
router.use('/email', funeralEmail);
router.use('/sms', funeralSMS);
router.use('/account', funeralAccount);
router.use('/user', funeralUser);
router.use('/staff', funeralStaff);
router.use('/form', managerFormByFuneral);
router.use('/hall', funeralHallInfo);
router.use('/cash', funeralCash);
router.use('/request', funeralDispatchRequest);

export default router;
