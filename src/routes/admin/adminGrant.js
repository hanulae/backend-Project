import express from 'express';
import * as grantService from '../../services/admin/grantService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

// 포인트/캐시 지급
router.post('/charge', async (req, res) => {
  try {
    const { targetType, targetId, type, amount } = req.body;

    const params = { targetType, targetId, type, amount };

    const result = await grantService.grantReward(params);
    res.status(200).json({ message: `${type} 지급 성공`, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
