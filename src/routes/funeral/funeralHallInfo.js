import express from 'express';
import logger from '../../config/logger.js';
import funeralHallInfoService from '../../services/funeral/funeralHallInfoService.js';
import { validateUUID, validateRequiredFields } from '../../middleware/validators.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 호실 정보 등록
router.post(
  '/create',
  authMiddleware,
  validateRequiredFields([
    'funeralHallName',
    'funeralHallSize',
    'funeralHallNumberOfMourners',
    'funeralHallPrice',
    'funeralHallDetailPrice',
  ]),
  async (req, res) => {
    try {
      const roomInfo = {
        funeralId: req.user.funeralId,
        funeralHallName: req.body.funeralHallName,
        funeralHallSize: req.body.funeralHallSize,
        funeralHallNumberOfMourners: req.body.funeralHallNumberOfMourners,
        funeralHallPrice: req.body.funeralHallPrice,
        funeralHallDetailPrice: req.body.funeralHallDetailPrice,
      };

      const result = await funeralHallInfoService.createFuneralHallInfo(roomInfo);

      return res.status(201).json(result);
    } catch (error) {
      logger.error(error);
      return res.status(500).json({
        message: '서버 오류',
      });
    }
  },
);

// 호실 정보 리스트 조회
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await funeralHallInfoService.getFuneralHallInfoList(funeralId, page, limit);

    return res.status(200).json({
      success: true,
      data: result.hallInfoList,
      pageInfo: result.pageInfo,
    });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      success: false,
      message: '호실 정보 리스트 조회 실패',
      error: error.message,
    });
  }
});

// 호실 정보 상세 조회
router.get(
  '/detail/:funeralHallId',
  validateUUID('funeralHallId', 'params'),
  validateRequiredFields('funeralHallId', 'params'),
  async (req, res) => {
    try {
      const funeralHallId = req.params.funeralHallId;

      const result = await funeralHallInfoService.getFuneralHallInfoDetail(funeralHallId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('호실 정보 상세 조회 실패', error.message);
      return res.status(500).json({
        success: false,
        message: '호실 정보 상세 조회 실패',
        error: error.message,
      });
    }
  },
);

// 호실 정보 수정
router.put(
  '/update',
  authMiddleware,
  validateUUID('funeralHallId', 'body'),
  validateRequiredFields(
    [
      'funeralHallId',
      'funeralHallName',
      'funeralHallSize',
      'funeralHallNumberOfMourners',
      'funeralHallPrice',
      'funeralHallDetailPrice',
      'version',
    ],
    'body',
  ),
  async (req, res) => {
    try {
      const newHallInfo = {
        funeralId: req.user.funeralId,
        funeralHallId: req.body.funeralHallId,
        funeralHallName: req.body.funeralHallName,
        funeralHallSize: req.body.funeralHallSize,
        funeralHallNumberOfMourners: req.body.funeralHallNumberOfMourners,
        funeralHallPrice: req.body.funeralHallPrice,
        funeralHallDetailPrice: req.body.funeralHallDetailPrice,
        version: req.body.version,
      };

      logger.info('호실 정보 수정 요청: ', {
        funeralHallId: newHallInfo.funeralHallId,
        version: newHallInfo.version,
        funeralId: newHallInfo.funeralId,
      });

      const result = await funeralHallInfoService.updateFuneralHallInfo(newHallInfo);

      return res.status(200).json(result);
    } catch (error) {
      switch (error.type) {
        case 'NOT_FOUND':
          logger.warn('호실 정보 없음:', error);
          return res.status(404).json({
            success: false,
            type: 'NOT_FOUND',
            message: error.message,
            hallId: error.hallId,
          });

        case 'ALREADY_DELETED':
          logger.warn('이미 삭제된 호실:', error);
          return res.status(410).json({
            // 410 Gone
            success: false,
            type: 'ALREADY_DELETED',
            message: error.message,
            hallId: error.hallId,
            deletedAt: error.deletedAt,
          });

        case 'VERSION_CONFLICT':
          logger.warn('버전 충돌:', error);
          return res.status(409).json({
            // 409 Conflict
            success: false,
            type: 'VERSION_CONFLICT',
            message: error.message,
            currentData: error.currentData,
            clientVersion: error.clientVersion,
            serverVersion: error.serverVersion,
          });

        case 'UNAUTHORIZED':
          logger.warn('권한 없음:', error);
          return res.status(403).json({
            success: false,
            type: 'UNAUTHORIZED',
            message: error.message,
            hallId: error.hallId,
          });

        default:
          logger.error('호실 정보 수정 실패:', error);
          return res.status(500).json({
            success: false,
            message: '호실 정보 수정 실패',
            error: error.message,
          });
      }
    }
  },
);
// 호실 정보 삭제
router.delete(
  '/delete/:funeralHallId',
  authMiddleware,
  validateUUID('funeralHallId', 'params'),
  async (req, res) => {
    try {
      const funeralHallId = req.params.funeralHallId;
      const funeralId = req.user.funeralId;

      const result = await funeralHallInfoService.deleteFuneralHallInfo(funeralHallId, funeralId);

      return res.status(200).json(result);
    } catch (error) {
      logger.error('호실 정보 삭제 실패: ', error.message);
      return res.status(500).json({
        success: false,
        message: '호실 정보 삭제 실패',
        error: error.message,
      });
    }
  },
);

export default router;
