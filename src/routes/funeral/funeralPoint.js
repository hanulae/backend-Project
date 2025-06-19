import express from 'express';
import authMiddleware from '../../middlewares/authMiddleware.js';
import * as funeralPointService from '../../services/funeral/funeralPointService.js';

const router = express.Router();

// 포인트 → 캐시 전환 요청
router.post('/convert-to-cash', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const { amount } = req.body;

    const result = await funeralPointService.convertPointToCash({ funeralId, amount });

    res.status(200).json({
      message: '포인트를 캐시로 전환 완료',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
