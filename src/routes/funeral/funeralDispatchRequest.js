import express from 'express';
import logger from '../../config/logger.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import dispatchRequestService from '../../services/common/dispatchRequestService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 출동 대기 내역 리스트 조회
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;

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

// 장례식장에서 제안한 호실 정보 조회 by managerFormBidId
router.get('/hall-info/:managerFormBidId', async (req, res) => {
  try {
    const managerFormBidId = req.params.managerFormBidId;

    const hallInfo = await dispatchRequestService.getFuneralHallInfoByBidId(managerFormBidId);

    return res.status(200).json({
      success: true,
      data: hallInfo,
    });
  } catch (error) {
    logger.error('장례식장 정보 조회중 오류 발생', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

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
      logger.error('출동 요청 승인중 오류 발생: ', error);
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
      logger.error('장례식장 거래완료 요청중 오류 발생', error);
      res.status(500).json({
        success: false,
        message: error.message || '거래완료 처리 중 오류가 발생했습니다.',
      });
    }
  },

  /**
   * 거래 흐름 상태 조회
   * 장례식장 거래 완료 시 버튼 상태 확인을 위한 라우터
   */
  router.get(
    '/transaction-detail/:dispatchRequestId',
    validateRequiredFields(['dispatchRequestId'], 'params'),
    validateUUID(['dispatchRequestId'], 'params'),
    async (req, res) => {
      try {
        const dispatchRequestId = req.params.dispatchRequestId;

        const transactionStatus =
          await dispatchRequestService.getTransactionStatus(dispatchRequestId);

        if (transactionStatus === null) {
          return res.status(200).json({
            success: true,
            data: null,
          });
        }

        res.status(200).json({
          success: true,
          data: transactionStatus,
        });
      } catch (error) {
        logger.error('거래 흐름 상태 조회 중 오류 발생', error);
        res.status(500).json({
          success: false,
          message: error.message || '거래 흐름 상태 조회 중 오류가 발생했습니다.',
        });
      }
    },
  ),

  /**
   * 거래완료 리스트 조회
   * @Header {string} funeralId(JWT) - 토큰 값 (추가예정)
   */
);

export default router;
