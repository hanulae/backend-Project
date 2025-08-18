/**
 * 파일명: managerForm.js
 * 설명: 상조팀장의 견적서 관련 라우터 관리
 */
import express from 'express';
import logger from '../../config/logger.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import managerFormService from '../../services/manager/managerFormService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/manager/form/create
 * @desc 상조팀장 견적 신청
 * @access Private
 * @param {Object} req.body
 * @param {string} req.body.chiefMournerName - 상주 이름
 * @param {string} req.body.checkInDate - 입실일자
 * @param {string} req.body.checkOutDate - 퇴실일자
 * @param {string[]} req.body.funeralList - 장례식장 리스트
 * @param {number} req.body.numberOfMourners - 예상 조문객 수
 * @param {number} req.body.roomSize - 평수 (선택)
 * @returns {Object} 201 - 견적 신청 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.post(
  '/create',
  authMiddleware,
  validateRequiredFields(['funeralList', 'chiefMournerName', 'checkInDate', 'checkOutDate']),
  validateUUID(['funeralList'], 'body'),
  async (req, res) => {
    try {
      const { funeralList, ...formData } = req.body;
      const managerId = req.user.managerId;

      // funeralList가 배열이 아닐 경우 예외 처리
      if (!Array.isArray(funeralList)) {
        return res
          .status(400)
          .json({ success: false, message: 'funeralList는 배열이어야 합니다.' });
      }

      // 중복 제거
      const uniqueFuneralListIds = [...new Set(funeralList)];

      // managerId 추가
      const managerFormData = {
        ...formData,
        managerId,
      };

      const result = await managerFormService.createManagerForm(
        managerFormData,
        uniqueFuneralListIds,
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('견적 신청 실패', error);
      res.status(500).json({
        success: false,
        message: '견적 신청 실패_Server Error',
      });
    }
  },
);

/**
 * @route GET /api/manager/form/list
 * @desc 모든 견적 신청 내역 리스트 조회
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.managerId - 상조팀장 ID
 * @returns {Object} 200 - 견적 내역 조회 성공
 * @throws {Error} 400 - 잘못된 요청
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;

    const result = await managerFormService.getManagerFormList(managerId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('견적 내역 조회 실패', error);
    res.status(500).json({
      success: false,
      message: '견적 내역 조회 실패_Server Error',
    });
  }
});

/**
 * @route GET /api/manager/form/bid/list/:managerFormId
 * @desc 한명의 상주님 견적 신청 내역 리스트 조회
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.managerFormId - 견적 신청 ID
 * @returns {Object} 200 - 견적 내역 조회 성공
 * @throws {Error} 400 - 잘못된 요청
 */
router.get(
  '/bid/list/:managerFormId',
  validateUUID('managerFormId', 'params'),
  validateRequiredFields('managerFormId', 'params'),
  async (req, res) => {
    try {
      const { managerFormId } = req.params;

      const result = await managerFormService.getManagerFormBidList(managerFormId);

      res.status(200).json(result);
    } catch (error) {
      logger.error('단일 상주님 견적서 리스트 조회 실패', error);
      res.status(500).json({
        success: false,
        message: '단일 상주님 견적서 리스트 조회 실패_Server Error',
      });
    }
  },
);

/**
 * @route GET /api/manager/form/bid/detail/:managerFormBidId
 * @desc 견적서에 대한 입찰 상세 내용 조회
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.managerFormBidId - 견적 입찰 ID
 * @returns {Object} 200 - 견적 입찰 상세 내용 조회 성공
 * @throws {Error} 400 - 잘못된 요청
 */
router.get(
  '/bid/detail/:managerFormBidId',
  validateUUID('managerFormBidId', 'params'),
  validateRequiredFields('managerFormBidId', 'params'),
  async (req, res) => {
    try {
      const { managerFormBidId } = req.params;
      const result = await managerFormService.getManagerFormBidDetail(managerFormBidId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error(error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

export default router;
