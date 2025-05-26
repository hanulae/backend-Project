import express from 'express';
import logger from '../../config/logger.js';
import funeralListService from '../../services/manager/funeralListService.js';
import { validateUUID, validateRequiredFields } from '../../middleware/validators.js';

const router = express.Router();

// 장례식장 리스트 조회 및 검색
/**
 * 전체 리스트 (검색 조건 없음)
 * GET /api/manager/funeral/search?page=1&limit=10

 * 검색어만
 * GET /api/manager/funeral/search?keyword=평화&page=1&limit=10

 * 지역만 (시/도)
 * GET /api/manager/funeral/search?sido=서울특별시&page=1&limit=10

 * 지역 조합
 * GET /api/manager/funeral/search?sido=서울특별시&sigungu=강남구&page=1&limit=10

 * 검색어 + 시/도
 * GET /api/manager/funeral/search?keyword=평화&sido=서울특별시&page=1&limit=10

 * 모든 조건
 * GET /api/manager/funeral/search?keyword=평화&sido=서울특별시&sigungu=강남구&page=1&limit=10
 */
router.get('/search', async (req, res) => {
  try {
    const { keyword, sido, sigungu, page, limit } = req.query;

    if (sigungu && !sido) {
      return res.status(400).json({
        success: false,
        message: '시군구 검색 시 시/도 정보가 필요합니다.',
      });
    }

    const result = await funeralListService.searchFuneralList({
      keyword,
      sido,
      sigungu,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.funerals,
      pageInfo: result.pageInfo,
    });
  } catch (error) {
    logger.error(error.message);
    return res.status(500).json({
      success: false,
      message: '장례식장 검색 실패',
      error: error.message,
    });
  }
});

// 장례식장 상세 조회
router.get(
  '/detail/:funeralListId',
  validateUUID(['funeralListId'], 'params'),
  validateRequiredFields(['funeralListId'], 'params'),
  async (req, res) => {
    try {
      const { funeralListId } = req.params;

      const result = await funeralListService.getFuneralDetail(funeralListId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error(error.message);
      return res.status(500).json({
        success: false,
        message: '장례식장 상세 정보 조회 실패',
        error: error.message,
      });
    }
  },
);

export default router;
