import express from 'express';
import logger from '../../config/logger.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import dispatchRequestService from '../../services/common/dispatchRequestService.js';

const router = express.Router();

/**
 * 출동 신청
 * @Header {string} managerId(JWT) - 토큰 값
 * @Body {
 *  address: string, // 주소
 *  addressDetail: string, // 상세 주소
 *  famPhoneNumber: string, // 가족 연락처
 *  managerPhoneNumber: string, // 상조 팀장 연락처
 *  emergencyPhoneNumber: string, // 비상 연락처
 *  funeralId: string, // 장례식장 Id
 *  managerFormId: string, // 견적서 Id
 *  managerFormBidId: string, // 입찰서 Id
 * }
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
  '/list/:managerId',
  validateRequiredFields(['managerId'], 'params'),
  validateUUID(['managerId'], 'params'),
  async (req, res) => {
    try {
      const managerId = req.params.managerId;

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
   * 장례식장 전화번호 불러오기
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
  ),

  /**
   * 상조 팀장 거래 완료
   * @Header {string} managerId(JWT) - 토큰 값 (추가예정)
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
  ),
);

export default router;
