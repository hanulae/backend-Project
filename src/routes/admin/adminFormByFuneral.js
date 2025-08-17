import express from 'express';
import logger from '../../config/logger.js';
import managerFormByFuneralService from '../../services/funeral/managerFormByFuneralService.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

/**
 * [GET] /admin/form/list
 * 장례식장별 견적(입찰) 내역 리스트 조회 (인증 필요)
 *
 * Query:
 * - funeralId: string (필수) — 조회 대상 장례식장 ID
 *
 * 동작:
 * - funeralId 필수 검증 후, 해당 장례식장의 입찰 목록을 조회합니다.
 *
 * Response:
 * - 200 OK: result(Array | Object) — 서비스에서 반환하는 원본 결과를 그대로 반환
 * - 400 Bad Request: funeralId 누락
 * - 500 Internal Server Error
 */
router.get('/list', adminAuthMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.query;
    console.log('🚀 ~ router.get ~ funeralId:', funeralId);

    if (!funeralId) {
      return res.status(400).json({
        message: 'funeralId is required',
      });
    }

    const result = await managerFormByFuneralService.getManagerFormByFuneralId(funeralId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: '서버 오류',
    });
  }
});

/**
 * [GET] /admin/form/detail
 * 입찰 상세 조회 (검증 미들웨어 적용, 인증 미적용)
 *
 * Query:
 * - managerFormBidId: string (필수, UUID)
 *
 * 미들웨어:
 * - validateUUID('managerFormBidId', 'query'): UUID 형식 검증
 * - validateRequiredFields('managerFormBidId', 'query'): 필수값 존재 검증
 *
 * Response:
 * - 200 OK: 상세 결과 객체
 * - 500 Internal Server Error
 */
router.get(
  '/detail',
  validateUUID('managerFormBidId', 'query'),
  validateRequiredFields('managerFormBidId', 'query'),
  async (req, res) => {
    try {
      const { managerFormBidId } = req.query;

      const result = await managerFormByFuneralService.getManagerFormDetail(managerFormBidId);

      return res.status(200).json(result);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        message: '서버 오류',
      });
    }
  },
);

/**
 * [PUT] /admin/form/bid
 * 입찰 신청/갱신 (검증 미들웨어 적용, 인증 미적용)
 *
 * Body:
 * - managerFormBidId: string (필수)
 * - funeralHallName: string (필수)
 * - funeralHallSize: string | number (필수)
 * - funeralHallNumberOfMourners: string | number (필수)
 * - funeralHallDetailPrice: string | number (필수)
 * - funeralHallPrice: string | number (필수)
 * - proponentMoney: number (필수, 0보다 큰 수)
 * - discount?: number (선택, 0 이상, 100 이하[%])
 *
 * 동작/검증:
 * - 제안가(proponentMoney) 숫자·양수 검증
 * - 할인률(discount) 숫자·0이상·100%이하 검증
 * - 파라미터 구성 후 서비스 계층에 위임하여 업데이트 처리
 *
 * Response:
 * - 200 OK: { success: true, message: '입찰 신청이 완료되었습니다.' }
 * - 400 Bad Request: 유효성 오류 시 상세 메시지
 */
router.put(
  '/bid',
  validateRequiredFields([
    'managerFormBidId',
    'funeralHallName',
    'funeralHallSize',
    'funeralHallNumberOfMourners',
    'funeralHallDetailPrice',
    'funeralHallPrice',
    'proponentMoney',
    'discount',
  ]),
  async (req, res) => {
    try {
      // 신청자의 Id 값을 토큰으로 받아서 유효한 유저인지 확인 및 검증 로직 필요 (2025.06.05)

      // 1. 제안가 유효성 검사
      if (isNaN(Number(req.body.proponentMoney)) || Number(req.body.proponentMoney) <= 0) {
        return res.status(400).json({
          success: false,
          message: '입찰 제안 금액은 0보다 큰 숫자여야 합니다.',
        });
      }

      // 2. 할인률 유효성 검사
      if (req.body.discount !== undefined) {
        const discountValue = parseFloat(req.body.discount);
        if (isNaN(discountValue) || discountValue < 0) {
          return res.status(400).json({
            success: false,
            message: '할인 금액은 0 이상의 숫자여야 합니다.',
          });
        }

        // 할인률 100% 초과 방지
        if (discountValue > 100) {
          return res.status(400).json({
            success: false,
            message: '할인률은 100%를 초과할 수 없습니다.',
          });
        }
      }

      // 파라미터 구성
      const params = {
        managerFormBidId: req.body.managerFormBidId,
        funeralHallName: req.body.funeralHallName,
        funeralHallSize: req.body.funeralHallSize,
        funeralHallNumberOfMourners: req.body.funeralHallNumberOfMourners,
        funeralHallDetailPrice: req.body.funeralHallDetailPrice,
        funeralHallPrice: req.body.funeralHallPrice,
        proponentMoney: req.body.proponentMoney,
        discount: req.body.discount,
      };

      await managerFormByFuneralService.updateManagerFormBid(params);

      return res.status(200).json({
        success: true,
        message: '입찰 신청이 완료되었습니다.',
      });
    } catch (error) {
      logger.error(error.message);
      return res.status(400).json({
        success: false,
        message: error,
      });
    }
  },
);

/**
 * [GET] /admin/form/bid/detail
 * 입찰 상세(비드 상세) 조회 (검증 미들웨어 적용, 인증 미적용)
 *
 * Query:
 * - managerFormBidId: string (필수)
 *
 * Response:
 * - 200 OK: { success: true, data: Object }
 * - 500 Internal Server Error
 */
router.get(
  '/bid/detail',
  validateRequiredFields('managerFormBidId', 'query'),
  validateUUID('managerFormBidId', 'query'),
  async (req, res) => {
    try {
      const { managerFormBidId } = req.query;

      const result = await managerFormByFuneralService.getManagerFormBidDetail(managerFormBidId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

export default router;
