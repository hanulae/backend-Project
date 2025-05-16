import express from 'express';
import logger from '../../config/logger.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import dispatchRequestService from '../../services/common/dispatchRequestService.js';

const router = express.Router();

/**
 * 출동 신청
 */
router.post(
  '/create',
  validateRequiredFields(
    [
      'address',
      'addressDetail',
      'managerPhoneNumber',
      'funeralId',
      'managerFormId',
      'managerFormBidId',
    ],
    'body',
  ),
  validateUUID(['funeralId', 'managerFormId', 'managerFormBidId'], 'body'),
  async (req, res) => {
    try {
      const params = req.body;

      await dispatchRequestService.createDispatchRequest(params);

      res.status(201).json({
        success: true,
        message: '출동 신청 완료',
      });
    } catch (error) {
      logger.error('출동 신청 실패', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

/**
 * 출동 진행 내역 상세
 */
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
      logger.error('출동 신청 내역 상세 조회중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

/**
 * 출동 신청 내역 리스트 조회
 */
router.get(
  '/list/:userId',
  validateRequiredFields(['userId'], 'params'),
  validateUUID(['userId'], 'params'),
  async (req, res) => {
    try {
      const userId = req.params.userId;

      const dispatchRequestList = await dispatchRequestService.getDispatchRequestList(userId);

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
  },
);

/**
 * 출동 신청 취소
 */
router.delete(
  '/cancel/:dispatchRequestId',
  validateRequiredFields(['dispatchRequestId'], 'params'),
  validateUUID(['dispatchRequestId'], 'params'),
  async (req, res) => {
    try {
      const dispatchRequestId = req.params.dispatchRequestId;

      await dispatchRequestService.cancelDispatchRequest(dispatchRequestId);

      res.status(200).json({
        success: true,
        message: '출동 신청 취소 완료',
      });
    } catch (error) {
      logger.error('출동 신청 취소 중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * 거래완료
   */
);

export default router;
