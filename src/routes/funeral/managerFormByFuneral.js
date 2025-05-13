import express from 'express';
import logger from '../../config/logger.js';
import managerFormByFuneralService from '../../services/funeral/managerFormByFuneral.js';
import { validateRequiredFields, validateUUID } from '../../middleware/validators.js';

const router = express.Router();

// 견적 내역 리스트 불러오기
router.get('/list', async (req, res) => {
  try {
    const { funeralId } = req.query; // 추후 토큰으로 처리

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
  validateRequiredFields(['managerFormBidId', 'funeralHallId', 'proponentMoney', 'discount']),
  validateUUID(['managerFormBidId', 'funeralHallId']),
  async (req, res) => {
    try {
      // 1. 제안가 유효성 검사
      if (isNaN(Number(req.body.proponentMoney)) || Number(req.body.proponentMoney) <= 0) {
        return res.status(400).json({
          success: false,
          message: '입찰 제안 금액은 0보다 큰 숫자여야 합니다.',
        });
      }

      // 2. 할인률 유효성 검사
      if (req.body.discount !== undefined) {
        if (isNaN(Number(req.body.discount)) || Number(req.body.discount) < 0) {
          return res.status(400).json({
            success: false,
            message: '할인 금액은 0 이상의 숫자여야 합니다.',
          });
        }
      }

      // 파라미터 구성
      const params = {
        managerFormBidId: req.body.managerFormBidId,
        funeralHallId: req.body.funeralHallId,
        proponentMoney: req.body.proponentMoney,
        discount: req.body.discount,
      };

      await managerFormByFuneralService.updateManagerFormBid(params);

      return res.status(200).json({
        success: true,
        message: '입찰 신청 완료',
      });
    } catch (error) {
      logger.error(error.message);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
);

export default router;
