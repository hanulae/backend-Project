/**
 * 장례식장 정보(리스트) 관리 라우터
 * - 장례식장 정보 조회 및 수정(파일 업로드 포함) 기능 제공
 * - 모든 엔드포인트는 인증이 필요합니다.
 */
import express from 'express';
import * as funeralListService from '../../services/funeral/funeralListService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import uploadFuneralRoomFile from '../../middlewares/uploadFuneralRoomFile.js';

const router = express.Router();

/**
 * [GET] /funeral/list/list
 * 장례식장 정보 조회 (인증 필요)
 *
 * Headers:
 * - Authorization: Bearer <JWT>
 *
 * Response:
 * - 200 OK: { success: true, data: Array|Object, images: string[] }
 * - 500 Internal Server Error
 */
// 장례식장 정보 조회
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

/**
 * [PUT] /funeral/list/update/funeralList
 * 장례식장 정보 수정 (인증 필요, 파일 업로드 지원)
 *
 * 미들웨어:
 * - authMiddleware: 인증 및 req.user.funeralId 제공
 * - uploadFuneralRoomFile: 다중 파일 업로드 처리 (예: S3에 업로드 후 file.location 제공)
 *
 * Body:
 * - 수정할 필드들(예: 장례식장 방 정보 등) + 업로드되는 이미지 파일
 *
 * 동작:
 * - 업로드된 파일이 있는 경우, 각 파일의 경로를 `updateData.funeralRoomFiles`에 배열로 주입
 * - 서비스 계층을 통해 장례식장 정보를 업데이트
 *
 * Response:
 * - 200 OK: { success: true, data: Object }
 * - 500 Internal Server Error
 */
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
