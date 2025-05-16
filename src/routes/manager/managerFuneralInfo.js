import express from 'express';
import * as funeralInfoService from '../../services/manager/funeralInfoService.js';

const router = express.Router();

// 장례식장 리스트 (무한스크롤 지원)
router.get('/list', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await funeralInfoService.getFuneralList({ page, limit });
    res.status(200).json({
      message: '장례식장 리스트 조회 성공',
      data: result.funerals,
      pageInfo: result.pageInfo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 장례식장 상세 조회
router.get('/:funeralId', async (req, res) => {
  try {
    const { funeralId } = req.params;
    const result = await funeralInfoService.getFuneralDetail(funeralId);
    res.status(200).json({
      message: '장례식장 상세 조회 성공',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 장례식장 상세 검색 (무한스크롤 + 필터)
router.get('/search/detail', async (req, res) => {
  try {
    const { keyword, location, capacityMin, capacityMax, page = 1, limit = 10 } = req.query;
    const result = await funeralInfoService.searchFuneralDetail({
      keyword,
      location,
      capacityMin,
      capacityMax,
      page,
      limit,
    });
    res.status(200).json({
      message: '장례식장 검색 결과 조회 성공',
      data: result.funerals,
      pageInfo: result.pageInfo,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
