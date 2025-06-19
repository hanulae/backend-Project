import express from 'express';
import * as adminCashRefundRequestService from '../../services/admin/adminCashRefundRequestService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

// [GET] 상조팀장 환급 요청 목록
router.get('/manager/refund', async (req, res) => {
  try {
    const result = await adminCashRefundRequestService.getGroupedManagerRefundRequests();
    res.status(200).json({ message: '상조팀장 환급 요청 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [GET] 장례식장 환급 요청 목록
router.get('/funeral/refund', async (req, res) => {
  try {
    const result = await adminCashRefundRequestService.getGroupedFuneralRefundRequests();
    res.status(200).json({ message: '장례식장 환급 요청 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 승인/거절 처리
router.patch('/:type/:requestId', async (req, res) => {
  try {
    const { type, requestId } = req.params; // type: manager | funeral
    const { action } = req.body; // action: approve | reject

    if (!['manager', 'funeral'].includes(type) || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: '유효하지 않은 요청입니다.' });
    }

    const result = await adminCashRefundRequestService.processRefundApproval({
      type,
      requestId,
      action,
    });

    res.status(200).json({
      message: `환급 요청이 ${action === 'approve' ? '승인' : '거절'}되었습니다.`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
