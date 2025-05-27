import express from 'express';
import * as funeralCashService from '../../services/funeral/funeralCashService.js';

const router = express.Router();

// 장례식장 캐시 충전
router.post('/charge', async (req, res) => {
  try {
    const { imp_uid, amount, funeralId } = req.body;
    const result = await funeralCashService.topupCash({ imp_uid, amount, funeralId });
    res.status(201).json({ message: '캐시 충전 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
