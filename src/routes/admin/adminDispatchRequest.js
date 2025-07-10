// src/routes/admin/adminDispatchRequest.js
import express from 'express';
import * as dispatchRequestService from '../../services/admin/adminDispatchRequestService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';
import logger from '../../config/logger.js';

const router = express.Router();

// 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

/**
 * 출동 신청 내역 리스트 조회
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

// 유저별 출동 요청 조회
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
