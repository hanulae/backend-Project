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
