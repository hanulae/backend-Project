import express from 'express';
import * as funeralListService from '../../services/funeral/funeralListService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 출동 대기 내역 리스트 조회
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;
    const funeralList = await funeralListService.getFuneralList(funeralId);
    res.status(200).json({
      success: true,
      data: funeralList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
