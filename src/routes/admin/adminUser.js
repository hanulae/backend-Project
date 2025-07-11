import express from 'express';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';
import * as adminUserService from '../../services/admin/adminUserService.js';

const router = express.Router();

// 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

// 전체 유저 목록 조회
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

// 특정 유저 정보 조회
router.get('/search/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        message: 'type 파라미터가 필요합니다. (manager 또는 funeral)',
      });
    }

    if (!['manager', 'funeral'].includes(type)) {
      return res.status(400).json({
        message: '유효하지 않은 타입입니다. (manager 또는 funeral)',
      });
    }

    const result = await adminUserService.getUserById(userId, type);

    let message = '유저 정보 조회 성공';
    if (type === 'manager') message = '상조팀장 정보 조회 성공';
    if (type === 'funeral') message = '장례식장 정보 조회 성공';

    res.status(200).json({
      message,
      data: result,
    });
  } catch (error) {
    console.error('특정 유저 정보 조회 오류:', error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
