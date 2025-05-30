import express from 'express';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';
import * as adminUserService from '../../services/admin/adminUserService.js';

const router = express.Router();

// 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

router.get('/userList', async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    const result = await adminUserService.getUsersByType(type);

    let message = '전체 유저 목록 조회 성공';
    if (type === 'manager') message = '상조팀장 목록 조회 성공';
    if (type === 'funeral') message = '장례식장 목록 조회 성공';

    res.status(200).json({ message, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
