import express from 'express';
import * as adminCashService from '../../services/admin/adminCashService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// 특정 장례식장 캐시 충전 내역 조회
router.get('/funeral/history/:funeralId', adminAuthMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.params;

    const history = await adminCashService.getFuneralCashChargeHistoryById(funeralId);
    res.status(200).json({ message: '장례식장 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 상조팀장 캐시 충전 내역 조회
router.get('/manager/history/:managerId', adminAuthMiddleware, async (req, res) => {
  try {
    const { managerId } = req.params;

    const history = await adminCashService.getManagerCashChargeHistoryById(managerId);
    res.status(200).json({ message: '상조팀장 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 특정 유저 캐시 충전 내역 조회
router.get('/history/:userId', adminAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    if (!['manager', 'funeral'].includes(type)) {
      return res
        .status(400)
        .json({ message: '유효하지 않은 타입입니다. manager, funeral 중 하나를 선택하세요.' });
    }

    const history = await adminCashService.getUserCashChargeHistoryById(userId, type);
    res.status(200).json({ message: '유저 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 전체유저 캐시 충전 내역 조회
router.get('/user/history', adminAuthMiddleware, async (req, res) => {
  try {
    const { type = 'all' } = req.query; // type: manager | funeral | all, default to 'all'

    if (!['manager', 'funeral', 'all'].includes(type)) {
      return res
        .status(400)
        .json({ message: '유효하지 않은 타입입니다. manager, funeral, all 중 하나를 선택하세요.' });
    }

    const history = await adminCashService.getAllUserCashChargeHistory(type);
    res.status(200).json({ message: '전체유저 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//특정 유저 캐시 지급하기
router.post('/user/addCash', adminAuthMiddleware, async (req, res) => {
  try {
    const { userId, amount, userType } = req.body; // userType 추가
    if (!['manager', 'funeral'].includes(userType)) {
      return res.status(400).json({ message: '유효하지 않은 사용자 타입입니다.' });
    }

    const result = await adminCashService.giveCashToUser(userId, amount, userType);
    res.status(200).json({ message: '캐시 지급 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 전체 회원 캐시 충전 내역 조회
router.get('/all/History', async (req, res) => {
  try {
    const result = await adminCashService.getAllCashChargeHistory();
    res.status(200).json({ message: '전체 캐시 충전 내역 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
