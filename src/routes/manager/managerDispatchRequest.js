/**
 * 파일명: managerDispatchRequest.js
 * 설명: 상조팀장의 출동 신청 관련 라우터 관리
 */
import express from 'express';
import logger from '../../config/logger.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import dispatchRequestService from '../../services/common/dispatchRequestService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/manager/dispatch-request/create
 * @desc 상조팀장 출동 신청
 * @access Private
 * @param {Object} req.body
 * @param {string} req.body.address - 주소
 * @param {string} req.body.addressDetail - 상세 주소
 * @param {string} req.body.managerPhoneNumber - 상조 팀장 연락처
 * @param {string} req.body.funeralId - 장례식장 Id
 * @param {string} req.body.managerFormId - 견적서 Id
 * @param {string} req.body.managerFormBidId - 입찰서 Id
 * @returns {Object} 201 - 출동 신청 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.post(
  '/create',
  authMiddleware,
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
      const managerId = req.user.managerId;
      const params = {
        ...req.body,
        managerId,
      };

      const dispatchRequest = await dispatchRequestService.createDispatchRequest(params);

      res.status(201).json({
        success: true,
        message: '출동 신청 완료',
        data: {
          dispatchRequestId: dispatchRequest.dispatchRequestId,
        },
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
 * @route GET /api/manager/dispatch-request/detail/:dispatchRequestId
 * @desc 출동 진행 내역 상세
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.dispatchRequestId - 출동 신청 ID
 * @returns {Object} 200 - 출동 신청 내역 상세 조회 성공
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
      logger.error('출동 신청 내역 상세 조회중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

/**
 * @route GET /api/manager/dispatch-request/transaction-detail/:dispatchRequestId
 * @desc 거래 흐름 상태 조회
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.dispatchRequestId - 출동 신청 ID
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

/**
 * @route GET /api/manager/dispatch-request/list
 * @desc 출동 신청 내역 리스트 조회
 * @access Private
 * @params {Object} req.user
 * @params {string} req.user.managerId - 상조팀장 ID
 * @returns {Object} 200 - 출동 신청 내역 리스트 조회 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;

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
 * @route DELETE /api/manager/dispatch-request/cancel/:dispatchRequestId
 * @desc 출동 신청 취소
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.dispatchRequestId - 출동 신청 ID
 * @returns {Object} 200 - 출동 신청 취소 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
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
);

/**
 * @route GET /api/manager/dispatch-request/funeral-phone-number/:funeralId
 * @desc 장례식장 전화번호 불러오기
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.funeralId - 장례식장 ID
 * @returns {Object} 200 - 장례식장 전화번호 불러오기 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.get(
  '/funeral-phone-number/:funeralId',
  validateRequiredFields(['funeralId'], 'params'),
  validateUUID(['funeralId'], 'params'),
  async (req, res) => {
    const funeralId = req.params.funeralId;

    const funeralPhoneNumber = await dispatchRequestService.getFuneralPhoneNumber(funeralId);

    res.status(200).json({
      success: true,
      funeralPhoneNumber,
    });
  },
);

/**
 * @route POST /api/manager/dispatch-request/complete/:dispatchRequestId
 * @desc 상조 팀장 거래 완료
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.dispatchRequestId - 출동 신청 ID
 * @returns {Object} 200 - 상조 팀장 거래 완료 성공
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
        'manager',
      );

      res.status(200).json(result);
    } catch (error) {
      logger.error('상조 팀장 거래 완료 요청중 오류 발생', error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

export default router;
