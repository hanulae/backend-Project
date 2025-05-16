import express from 'express';
import * as cashService from '../../services/manager/cashService.js';

const router = express.Router();

// 캐시 환급 요청
router.post('/request-withdraw', async (req, res) => {
  try {
    const { managerId, amount } = req.body;
    const result = await cashService.requestCashWithdraw(managerId, amount);
    res.status(200).json({ message: '캐시 환급 요청 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 캐시 사용/적립 내역
router.get('/history', async (req, res) => {
  try {
    const { managerId, page = 1, limit = 10 } = req.query;
    const result = await cashService.getCashHistory(managerId, page, limit);
    res.status(200).json({ message: '캐시 내역 조회 성공', ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
