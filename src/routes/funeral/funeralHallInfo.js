/**
 * 파일명: funeralHallInfo.js
 * 설명: 장례식장의 호실 정보 관리 라우터 관리
 */
import express from 'express';
import logger from '../../config/logger.js';
import funeralHallInfoService from '../../services/funeral/funeralHallInfoService.js';
import { validateUUID, validateRequiredFields } from '../../middleware/validators.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/funeral/hall-info/create
 * @desc 호실 정보 등록
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.funeralId - 장례식장 ID
 * @param {Object} req.body
 * @param {string} req.body.funeralHallName - 호실 이름
 * @param {number} req.body.funeralHallSize - 호실 크기
 * @param {number} req.body.funeralHallNumberOfMourners - 호실 조문객 수
 * @param {number} req.body.funeralHallPrice - 호실 가격
 * @param {number} req.body.funeralHallDetailPrice - 호실 상세 가격
 * @returns {Object} 201 { success: true, data: roomInfo } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
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

/**
 * @route GET /api/funeral/hall-info/list
 * @desc 호실 정보 리스트 조회
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.funeralId - 장례식장 ID
 * @param {Object} req.query
 * @param {number} req.query.page - 페이지 번호
 * @param {number} req.query.limit - 페이지 당 항목 수
 * @returns {Object} 200 { success: true, data: hallInfoList, pageInfo } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    // JWT 토큰에서 funeralId 가져오기
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

/**
 * @route GET /api/funeral/hall-info/detail/:funeralHallId
 * @desc 호실 정보 상세 조회
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.funeralHallId - 호실 ID
 * @returns {Object} 200 { success: true, data: hallInfo } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
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

/**
 * @route PUT /api/funeral/hall-info/update
 * @desc 호실 정보 수정
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.funeralId - 장례식장 ID
 * @param {Object} req.body
 * @param {string} req.body.funeralHallId - 호실 ID
 * @param {string} req.body.funeralHallName - 호실 이름
 * @param {number} req.body.funeralHallSize - 호실 크기
 * @param {number} req.body.funeralHallNumberOfMourners - 호실 조문객 수
 * @param {number} req.body.funeralHallPrice - 호실 가격
 * @param {number} req.body.funeralHallDetailPrice - 호실 상세 가격
 * @param {number} req.body.version - 호실 버전
 * @returns {Object} 200 { success: true, data: hallInfo } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
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

/**
 * @route DELETE /api/funeral/hall-info/delete/:funeralHallId
 * @desc 호실 정보 삭제
 * @access Private
 * @params {Object} req.user
 * @params {string} req.user.funeralId - 장례식장 ID
 * @param {Object} req.params
 * @param {string} req.params.funeralHallId - 호실 ID
 * @returns {Object} 200 { success: true, data: hallInfo } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
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

/**
 * @route GET /api/funeral/hall-info/summary/:funeralId
 * @desc 호실 요약 정보 불러오기 (장례식장 상세 페이지에 노출 되는 정보)
 * @access Private
 * @param {Object} req.params
 * @param {string} req.params.funeralId - 장례식장 ID
 * @returns {Object} 200 { success: true, data: hallInfo } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.get('/summary/:funeralId', async (req, res) => {
  try {
    const funeralId = req.params.funeralId;

    const result = await funeralHallInfoService.getFuneralHallInfoSummary(funeralId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('호실 요약 정보 불러오기 실패: ', error.message);
    return res.status(500).json({
      success: false,
      message: '호실 요약 정보 불러오기 실패',
      error: error.message,
    });
  }
});

export default router;
