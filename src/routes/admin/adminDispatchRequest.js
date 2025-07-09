// src/routes/admin/adminDispatchRequest.js
import express from 'express';
import * as dispatchRequestService from '../../services/admin/adminDispatchRequestService.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import logger from '../../config/logger.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

/**
 * 출동 신청 내역 리스트 조회
 */
router.get('/list', adminAuthMiddleware, async (req, res) => {
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

// 출동 요청 상세 조회
router.get(
  '/detail/:dispatchRequestId',
  validateRequiredFields(['dispatchRequestId'], 'params'),
  validateUUID(['dispatchRequestId'], 'params'),
  async (req, res) => {
    try {
      const dispatchRequestId = req.params.dispatchRequestId;

      const dispatchRequestDetail =
        await dispatchRequestService.getDispatchRequestDetail(dispatchRequestId);

      res.status(200).json({
        success: true,
        data: dispatchRequestDetail,
      });
    } catch (error) {
      logger.error('출동 내역 상세 조회중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

export default router;
