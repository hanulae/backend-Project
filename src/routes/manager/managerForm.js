import express from 'express';
import logger from '../../config/logger.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import managerFormService from '../../services/manager/managerFormService.js';

const router = express.Router();

/**
 * 상조팀장 견적 신청서 생성
 */
router.post(
  '/create',
  validateRequiredFields(['funeralList', 'chiefMournerName', 'checkInDate', 'checkOutDate']),
  validateUUID(['funeralList']),
  async (req, res) => {
    try {
      // 필수 데이터 추가 검증 로직 필요
      const { funeralList, ...managerFormData } = req.body;

      // funeralList가 배열이 아닐 경우 예외 처리
      if (!Array.isArray(funeralList)) {
        return res
          .status(400)
          .json({ success: false, message: 'funeralList는 배열이어야 합니다.' });
      }

      // 중복 제거
      const uniqueFuneralListIds = [...new Set(funeralList)];

      const result = await managerFormService.createManagerForm(
        managerFormData,
        uniqueFuneralListIds,
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('견적 신청서 생성 실패', error);
      res.status(500).json({
        success: false,
        message: '견적 신청서 작성 실패_Server Error',
      });
    }
  },
);

/**
 * 모든 견적 신청 내역 리스트 조회
 * 피그마 상의 헤더 견적내역 부분
 */
router.get('/list', async (req, res) => {
  try {
    const { managerId } = req.body; // 추후 토큰으로 처리

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
 * 한명의 상주님 견적 신청 내역 리스트 조회
 * 피그마 헤더 홍길동 상주님 견적 페이지 부분
 */
router.get(
  '/bid/list',
  validateUUID('managerFormId', 'query'),
  validateRequiredFields('managerFormId', 'query'),
  async (req, res) => {
    try {
      const { managerFormId } = req.query;

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
 * 견적서에 대한 입찰 상세 내용 조회
 * 피그마의 입찰 상세 부분
 */
router.get(
  '/bid/detail',
  validateUUID('managerFormBidId', 'query'),
  validateRequiredFields('managerFormBidId', 'query'),
  async (req, res) => {
    try {
      const { managerFormBidId } = req.query;

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
