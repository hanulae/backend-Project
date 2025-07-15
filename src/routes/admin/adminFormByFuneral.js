import express from 'express';
import logger from '../../config/logger.js';
import managerFormByFuneralService from '../../services/funeral/managerFormByFuneralService.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// 견적 내역 리스트 불러오기
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

// 견적 상세 불러오기
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

// 입찰 신청
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
