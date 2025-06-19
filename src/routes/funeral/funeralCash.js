import express from 'express';
import * as funeralCashService from '../../services/funeral/funeralCashService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 장례식장 캐시 충전
router.post('/charge', authMiddleware, async (req, res) => {
  try {
    const { imp_uid, amount, funeralId } = req.body;
    const result = await funeralCashService.topupCash({ imp_uid, amount, funeralId });
    res.status(201).json({ message: '캐시 충전 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 캐시 환급 요청 (장례식장)
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const { amountCash } = req.body;

    const params = { funeralId, amountCash };
    const result = await funeralCashService.requestCashRefund(params);

    res.status(200).json({ message: '캐시 환급 요청 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 캐시 사용/적립 내역 조회
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const history = await funeralCashService.getCashHistory(funeralId);
    res.status(200).json({ message: '캐시 히스토리 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
