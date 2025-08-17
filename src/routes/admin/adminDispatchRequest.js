// src/routes/admin/adminDispatchRequest.js
/**
 * 관리자 출동(배차) 요청 라우터
 * - 출동 신청 내역 리스트 조회, 유저별 출동 요청 조회 기능을 제공합니다.
 * - 모든 엔드포인트는 관리자 인증이 필요합니다.
 */

import express from 'express'; // Express 라우팅
import * as dispatchRequestService from '../../services/admin/adminDispatchRequestService.js'; // 출동 요청 관련 비즈니스 로직
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js'; // 관리자 인증 미들웨어(JWT 검증 및 req.user 주입)
import logger from '../../config/logger.js'; // 서버 로깅 유틸

/** 라우터 인스턴스 생성 */
const router = express.Router();

/**
 * 모든 라우트에 관리자 인증 미들웨어 적용
 * - 이후 정의되는 모든 엔드포인트는 인증을 통과해야 접근 가능
 */
router.use(adminAuthMiddleware);

/**
 * [GET] /admin/dispatch/list
 * 출동 신청 내역 리스트 조회
 *
 * Query:
 * - managerId?: string (선택) — 특정 상조팀장 기준으로 필터링
 *
 * Response:
 * - 200 OK: { success: true, data: Array }
 * - 500 Internal Server Error: 서버 내부 오류
 */
router.get('/list', async (req, res) => {
  try {
    const managerId = req.query.managerId;

    const dispatchRequestList = await dispatchRequestService.getDispatchRequestList(managerId);

    res.status(200).json({
      success: true,
      data: dispatchRequestList,
    });
  } catch (error) {
    logger.error('출동 내역 리스트 조회중 오류 발생', error.message);
    res.status(500).json({
      success: false,
      message: '출동 내역 리스트 조회중 오류 발생 ' + error.message,
    });
  }
});

/**
 * [GET] /admin/dispatch/user/dispatch/requests
 * 유저별 출동 요청 조회 (상조팀장 또는 장례식장)
 *
 * Query:
 * - userId: string (필수) — 조회 대상 유저 ID
 * - userType: 'manager' | 'funeral' (필수) — 유저 유형
 *
 * 동작:
 * - userType에 따라 상조팀장/장례식장 기준으로 출동 요청 목록 조회
 *
 * Response:
 * - 200 OK: { success: true, data: Array }
 * - 400 Bad Request: 필수 파라미터 누락 또는 userType 유효성 오류
 * - 500 Internal Server Error
 */
router.get('/user/dispatch/requests', async (req, res) => {
  try {
    const { userId, userType } = req.query;

    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'userId와 userType이 필요합니다.',
      });
    }

    if (!['manager', 'funeral'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 userType입니다. (manager 또는 funeral)',
      });
    }

    let dispatchRequests;
    if (userType === 'manager') {
      dispatchRequests = await dispatchRequestService.getDispatchRequestsByManagerId(userId);
    } else if (userType === 'funeral') {
      dispatchRequests = await dispatchRequestService.getDispatchRequestsByFuneralId(userId);
    }

    res.status(200).json({
      success: true,
      data: dispatchRequests,
    });
  } catch (error) {
    logger.error('유저별 출동 요청 조회 중 오류 발생', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
