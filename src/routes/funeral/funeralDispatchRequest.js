import express from 'express';
import logger from '../../config/logger.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import dispatchRequestService from '../../services/common/dispatchRequestService.js';

const router = express.Router();

// 출동 대기 내역 리스트 조회
router.get(
  '/list/:funeralId',
  validateRequiredFields(['funeralId'], 'params'),
  validateUUID(['funeralId'], 'params'),
  async (req, res) => {
    try {
      const funeralId = req.params.funeralId;

      const dispatchRequestList = await dispatchRequestService.getDispatchRequestList(funeralId);

      res.status(200).json({
        success: true,
        data: dispatchRequestList,
      });
    } catch (error) {
      logger.error('출동 내역 리스트 조회중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

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

// 출동 요청 승인
router.post(
  '/approve/:dispatchRequestId',
  validateRequiredFields(['dispatchRequestId'], 'params'),
  validateUUID(['dispatchRequestId'], 'params'),
  async (req, res) => {
    try {
      const dispatchRequestId = req.params.dispatchRequestId;

      await dispatchRequestService.approveDispatchRequest(dispatchRequestId);

      res.status(200).json({
        success: true,
        message: '출동 요청 승인 완료',
      });
    } catch (error) {
      logger.error('출동 요청 승인중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

/**
 * 장례식장 거래완료
 * @Header {string} funeralId(JWT) - 토큰 값 (추가예정)
 * @Body {
 *  dispatchRequestId: string, // 출동 신청 Id
 * }
 */
router.post(
  '/complete/:dispatchRequestId',
  validateRequiredFields(['dispatchRequestId'], 'params'),
  validateUUID(['dispatchRequestId'], 'params'),
  async (req, res) => {
    try {
      const dispatchRequestId = req.params.dispatchRequestId;

      const result = await dispatchRequestService.completeDispatchRequest(
        dispatchRequestId,
        'funeral',
      );

      return res.status(200).json({
        success: result.success,
        message: result.message,
        status: result.status,
      });
    } catch (error) {
      logger.error('장례식장 거래완료 요청중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

export default router;
