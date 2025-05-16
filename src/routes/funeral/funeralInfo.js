import express from 'express';
import logger from '../../config/logger.js';
import funeralInfoService from '../../services/funeral/funeralInfoService.js';
import { validateUUID, validateRequiredFields } from '../../middleware/validators.js';

const router = express.Router();

router.post(
  '/create',
  validateUUID('funeralId', 'body'),
  validateRequiredFields('funeralId', 'body'),
  async (req, res) => {
    try {
      const roomInfo = {
        funeralId: req.body.funeralId,
        funeralHallName: req.body.funeralHallName,
        funeralHallSize: req.body.funeralHallSize,
        funeralHallNumberOfMourners: req.body.funeralHallNumberOfMourners,
        funeralHallPrice: req.body.funeralHallPrice,
        funeralHallDetailPrice: req.body.funeralHallDetailPrice,
      };

      const result = await funeralInfoService.createFuneralHallInfo(roomInfo);

      return res.status(201).json(result);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        message: '서버 오류',
      });
    }
  },
);

router.get('/hall/list', async (req, res) => {
  try {
    const funeralId = req.query.funeralId; // 토큰으로 처리

    const result = await funeralInfoService.getFuneralHallInfoList(funeralId);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      message: '서버 오류',
    });
  }
});

export default router;
