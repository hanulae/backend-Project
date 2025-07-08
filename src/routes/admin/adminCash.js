import express from 'express';
import * as adminCashService from '../../services/admin/adminCashService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 관리자용 전체 캐시 충전 내역 조회
router.get('/funeral/history', authMiddleware, async (req, res) => {
  try {
    const history = await adminCashService.getAllFuneralCashChargeHistory();
    res.status(200).json({ message: '전체 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 상조팀장 전체 캐시 충전 내역 조회
router.get('/manager/history', authMiddleware, async (req, res) => {
  try {
    const history = await adminCashService.getAllManagerCashChargeHistory();
    res.status(200).json({ message: '상조팀장 전체 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
