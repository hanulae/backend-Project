import express from 'express';
import * as funeralApprovalService from '../../services/admin/adminFuneralApprovalService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// 🔐 모든 요청에 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

// [GET] 가입 요청 목록 (승인됨 vs 요청중)
router.get('/requests', async (req, res) => {
  try {
    const result = await funeralApprovalService.getGroupedFuneralList();
    res.status(200).json({ message: '가입 요청 목록 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/requests/file/:funeralId/file', async (req, res) => {
  try {
    const { funeralId } = req.params;
    const file = await funeralApprovalService.getFuneralDocument(funeralId);

    if (!file) {
      return res.status(404).json({ message: '등록된 파일이 없습니다.' });
    }

    res.status(200).json({ message: '장례식장 추가파일 조회 성공', data: file });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ 장례식장 가입 승인/거절
router.patch('/requests/approve/:funeralId', async (req, res) => {
  try {
    const { funeralId } = req.params;
    const { isApproved } = req.body;

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ message: 'isApproved는 true 또는 false여야 합니다.' });
    }

    const result = await funeralApprovalService.setApprovalStatus(funeralId, isApproved);

    if (result === 'invalid_uuid') {
      return res.status(400).json({ message: '유효하지 않은 UUID 형식입니다.' });
    }

    if (!result) {
      return res.status(404).json({ message: '존재하지 않는 장례식장 ID입니다.' });
    }

    res.status(200).json({
      message: isApproved ? '가입 승인 완료' : '가입 거절 처리 완료',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
