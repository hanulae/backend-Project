import express from 'express';
import noticeRoute from './noticeRoute.js';
import authValidationRouter from './authValidationRouter.js';
import notificationRoute from './notificationRoute.js';

const router = express.Router();

// 공통 라우트 설정
router.use('/notice', noticeRoute);
router.use('/auth', authValidationRouter);
router.use('/notification', notificationRoute);

export default router;
