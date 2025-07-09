import express from 'express';
import * as adminAuthService from '../../services/admin/adminAuthService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';
import fcmService from '../../services/common/fcmService.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { adminEmail, adminPassword } = req.body;
    const result = await adminAuthService.loginAdmin({ adminEmail, adminPassword });

    res.status(200).json({ message: '로그인 성공', ...result });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// 로그아웃
router.post('/logout', adminAuthMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { deviceId } = req.body; // 선택적으로 특정 기기만 로그아웃

    // FCM 토큰 비활성화
    try {
      await fcmService.deactivateUserTokens({
        userId,
        userType,
        deviceId, // deviceId가 없으면 모든 토큰 비활성화
      });
    } catch (fcmError) {
      console.warn('FCM 토큰 비활성화 실패:', fcmError.message);
      // FCM 오류가 있어도 로그아웃은 계속 진행
    }

    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
