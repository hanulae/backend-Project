import express from 'express';
import logger from '../../config/logger.js';
import managerFormByFuneralService from '../../services/funeral/managerFormByFuneralService.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 견적 내역 리스트 불러오기
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;

    if (!funeralId) {
      return res.status(400).json({
        message: 'funeralId is required',
      });
    }

    const result = await managerFormByFuneralService.getManagerForm(funeralId);

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
  authMiddleware,
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
      const { funeralId } = req.user;

      // 0. 장례식장 입찰 시도 시 현재 입찰 내역과 캐시 비교 후 입찰 가능여부 판단. (추후 개발로 미뤄짐)
      // const checkAboutCashAmount =
      //   await managerFormByFuneralService.checkAboutCashAmount(funeralId);

      // if (checkAboutCashAmount.success === false) {
      //   logger.info(`입찰 가능여부 확인: ${funeralId}`);
      //   logger.info(`입찰 실패: ${checkAboutCashAmount.message}`);
      //   return res.status(400).json({
      //     success: false,
      //     message: checkAboutCashAmount.message,
      //     errorCode: 'INSUFFICIENT_CASH',
      //   });
      // }

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
        funeralId: funeralId,
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
