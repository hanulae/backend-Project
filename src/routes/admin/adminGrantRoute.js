import express from 'express';
import * as grantService from '../../services/admin/grantService.js';

const router = express.Router();

// 포인트/캐시 지급
router.post('/grant', async (req, res) => {
  try {
    const { targetType, targetId, type, amount } = req.body;
    const result = await grantService.grantReward({ targetType, targetId, type, amount });
    res.status(200).json({ message: `${type} 지급 성공`, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
