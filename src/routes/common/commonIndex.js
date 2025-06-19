import express from 'express';
import noticeRoute from './noticeRoute.js';
import authValidationRouter from './authValidationRouter.js';

const router = express.Router();

// 공통 라우트 설정
router.use('/notice', noticeRoute);
router.use('/auth', authValidationRouter);

export default router;
