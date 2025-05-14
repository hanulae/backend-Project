import express from 'express';
import funeralAuth from './funeralAuth.js';
import funeralEmail from './funeralEmail.js';
import funeralSMS from './funeralSMS.js';
import funeralAccount from './funeralAccount.js';
import funeralUser from './funeralUser.js';

const router = express.Router();

router.use('/auth', funeralAuth);
router.use('/email', funeralEmail);
router.use('/sms', funeralSMS);
router.use('/account', funeralAccount);
router.use('/user', funeralUser);

export default router;
