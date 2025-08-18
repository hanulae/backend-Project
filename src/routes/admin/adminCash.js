/**
 * 관리자 캐시 관리 라우터
 * - /admin/cash 하위에서 캐시 충전 내역 조회 및 캐시 지급 관련 API를 제공합니다.
 * - 민감 엔드포인트는 인증 미들웨어를 통과해야 합니다.
 */

import express from 'express'; // Express 라우팅 사용
import * as adminCashService from '../../services/admin/adminCashService.js'; // 캐시 관련 비즈니스 로직
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js'; // 관리자 인증(JWT 검증 및 req.user 주입)

/** 라우터 인스턴스 생성 */
const router = express.Router();

/**
 * [GET] /admin/cash/funeral/history/:funeralId
 * 특정 장례식장의 캐시 충전 내역을 조회합니다. (인증 필요)
 *
 * Path Params:
 * - funeralId: string (장례식장 ID)
 *
 * Response:
 * - 200 OK: { message: '장례식장 캐시 충전 내역 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
router.get('/funeral/history/:funeralId', adminAuthMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.params;

    const history = await adminCashService.getFuneralCashChargeHistoryById(funeralId);
    res.status(200).json({ message: '장례식장 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/cash/manager/history/:managerId
 * 특정 상조팀장의 캐시 충전 내역을 조회합니다. (인증 필요)
 *
 * Path Params:
 * - managerId: string (상조팀장 ID)
 *
 * Response:
 * - 200 OK: { message: '상조팀장 캐시 충전 내역 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
router.get('/manager/history/:managerId', adminAuthMiddleware, async (req, res) => {
  try {
    const { managerId } = req.params;

    const history = await adminCashService.getManagerCashChargeHistoryById(managerId);
    res.status(200).json({ message: '상조팀장 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/cash/history/:userId?type=manager|funeral
 * 특정 유저(상조팀장 또는 장례식장)의 캐시 충전 내역을 조회합니다. (인증 필요)
 *
 * Path Params:
 * - userId: string (유저 ID)
 * Query:
 * - type: 'manager' | 'funeral' (필수)
 *
 * Response:
 * - 200 OK: { message: '유저 캐시 충전 내역 조회 성공', data: Array }
 * - 400 Bad Request: type 유효성 오류
 * - 500 Internal Server Error
 */
router.get('/history/:userId', adminAuthMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    console.log('🚀 ~ router.get ~ userId, type:', userId, type);

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

/**
 * [GET] /admin/cash/user/history?type=manager|funeral|all
 * 전체 유저의 캐시 충전 내역을 유형별로 조회합니다. (인증 필요)
 *
 * Query:
 * - type: 'manager' | 'funeral' | 'all' (기본값: 'all')
 *
 * Response:
 * - 200 OK: { message: '전체유저 캐시 충전 내역 조회 성공', data: Array }
 * - 400 Bad Request: type 유효성 오류
 * - 500 Internal Server Error
 */
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

/**
 * [POST] /admin/cash/user/addCash
 * 특정 유저에게 캐시를 지급합니다. (인증 필요)
 *
 * Request Body:
 * - userId: string (유저 ID)
 * - amount: number (지급할 캐시 금액)
 * - userType: 'manager' | 'funeral' (유저 유형)
 *
 * Response:
 * - 200 OK: { message: '캐시 지급 성공', data: Object }
 * - 400 Bad Request: userType 유효성 오류
 * - 500 Internal Server Error
 */
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

/**
 * [GET] /admin/cash/all/History
 * 전체 회원의 캐시 충전 내역을 전체 조회합니다. (인증 불필요)
 *
 * Response:
 * - 200 OK: { message: '전체 캐시 충전 내역 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
router.get('/all/History', async (req, res) => {
  try {
    const result = await adminCashService.getAllCashChargeHistory();
    res.status(200).json({ message: '전체 캐시 충전 내역 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
