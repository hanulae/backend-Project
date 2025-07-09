import express from 'express';
import authMiddleware from '../../middlewares/authMiddleware.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import { getManagerById } from '../../services/manager/managerUserService.js';
import { getFuneralById } from '../../services/funeral/funeralUserService.js';

const router = express.Router();

router.get('/manager', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId; // 상조팀장 아이디
    // DB에서 유저 정보 조회
    const manager = await getManagerById(managerId);

    // 토큰 재발급
    const payload = {
      managerId: manager.managerId,
      managerUsername: manager.managerUsername,
      managerPhone: manager.managerPhoneNumber,
      role: 'manager',
      type: 'manager',
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(200).json({
      success: true,
      message: '상조팀장 로그인 유지',
      manager, // 모든 유저 정보
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/funeral', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId; // 장례식장 아이디
    // DB에서 유저 정보 조회
    const funeral = await getFuneralById(funeralId);

    // 토큰 재발급
    const payload = {
      funeralId: funeral.funeralId,
      funeralUsername: funeral.funeralUsername,
      funeralPhone: funeral.funeralPhoneNumber,
      role: 'funeral',
      type: 'funeral',
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(200).json({
      success: true,
      message: '장례식장 로그인 유지',
      funeral, // 모든 유저 정보
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/admin', adminAuthMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: '관리자 로그인 유지',
    user: {
      userId: req.user.id,
      userType: 'admin',
      userName: req.user.name,
      // 기타 필요한 사용자 정보
    },
  });
});

export default router;
