import express from 'express';
import authMiddleware from '../../middlewares/authMiddleware.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

router.get('/manager', authMiddleware, (req, res) => {
  res.status(200).json({ message: '상조팀장 로그인 유지', user: req.user });
});

router.get('/funeral', authMiddleware, (req, res) => {
  res.status(200).json({ message: '장례식장 로그인 유지', user: req.user });
});

router.get('/admin', adminAuthMiddleware, (req, res) => {
  res.status(200).json({ message: '관리자 로그인 유지', user: req.user });
});

export default router;
