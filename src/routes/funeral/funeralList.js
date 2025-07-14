import express from 'express';
import * as funeralListService from '../../services/funeral/funeralListService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import uploadFuneralRoomFile from '../../middlewares/uploadFuneralRoomFile.js';

const router = express.Router();

//장례식장 정보 조회
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;
    console.log('🚀 ~ router.get ~ funeralId:', funeralId);
    const funeralList = await funeralListService.getFuneralList(funeralId);
    console.log('🚀 ~ router.get ~ funeralList:', funeralList);
    res.status(200).json({
      success: true,
      data: funeralList.funeralList,
      images: funeralList.images,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Update funeral list entry
router.put('/update/funeralList', authMiddleware, uploadFuneralRoomFile, async (req, res) => {
  try {
    const { funeralId } = req.user;
    const updateData = req.body;
    console.log('🚀 ~ router.put ~ updateData:', updateData);

    console.log('🚀 ~ router.put ~ req.files:', req.files);
    // 파일 경로 추가
    if (req.files) {
      updateData.funeralRoomFiles = req.files.map((file) => file.location);
    }

    const updatedFuneral = await funeralListService.updateFuneralList(funeralId, updateData);
    res.status(200).json({
      success: true,
      data: updatedFuneral,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
