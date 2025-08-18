/**
 * 파일명: funeralDispatchRequest.js
 * 설명: 장례식장의 출동요청 조회/승인/거래완료 관련 라우터 관리
 */
import express from 'express';
import logger from '../../config/logger.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import dispatchRequestService from '../../services/common/dispatchRequestService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/funeral/request/list
 * @desc 출동 대기 내역 리스트 조회
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.funeralId - 장례식장 ID
 * @returns {Object} 200 - 출동 대기 내역 리스트 조회 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
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

/**
 * @route GET /api/funeral/request/detail/:dispatchRequestId
 * @desc 출동 요청 상세 조회
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.dispatchRequestId - 출동 요청 ID
 * @returns {Object} 200 - 출동 요청 상세 조회 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
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
      logger.error('출동 내역 상세 조회중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

/**
 * @route GET /api/funeral/request/hall-info/:managerFormBidId
 * @desc 장례식장에서 제안한 호실 정보 조회 by managerFormBidId
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.managerFormBidId - 견적 입찰 ID
 * @returns {Object} 200 - 장례식장에서 제안한 호실 정보 조회 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
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

/**
 * @route POST /api/funeral/request/approve/:dispatchRequestId
 * @desc 출동 요청 승인
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.dispatchRequestId - 출동 요청 ID
 * @returns {Object} 200 - 출동 요청 승인 완료
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
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
 * @route POST /api/funeral/request/complete/:dispatchRequestId
 * @desc 장례식장 거래완료
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.dispatchRequestId - 출동 요청 ID
 * @returns {Object} 200 - 출동 요청 승인 완료
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
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
);

/**
 * @route GET /api/funeral/request/transaction-detail/:dispatchRequestId
 * @desc 거래 흐름 상태 조회
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.dispatchRequestId - 출동 요청 ID
 * @returns {Object} 200 - 거래 흐름 상태 조회 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
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
);

export default router;
