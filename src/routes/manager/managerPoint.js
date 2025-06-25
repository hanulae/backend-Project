import express from 'express';
import * as pointService from '../../services/manager/managerPointService.js';
import authMiddleware from '../../middlewares/authMiddleware.js'; // JWT 인증 미들웨어

const router = express.Router();

// 포인트 환급 요청
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { amountPoint } = req.body;
    const managerId = req.user.managerId; // ✅ JWT 토큰에서 추출

    const result = await pointService.requestPointToCash(managerId, amountPoint);
    res.status(200).json({ message: '포인트 환급 요청 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 포인트 사용/적립 내역
router.get('/history', async (req, res) => {
  try {
    const { managerId, page = 1, limit = 10 } = req.query;
    const result = await pointService.getPointHistory(managerId, page, limit);
    res.status(200).json({ message: '포인트 내역 조회 성공', ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 현재 포인트 조회
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const currentPoint = await pointService.getCurrentPoint(managerId);
    res.status(200).json({ message: '현재 포인트 조회 성공', currentPoint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
