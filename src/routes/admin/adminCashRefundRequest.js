import express from 'express';
import * as adminCashRefundRequestService from '../../services/admin/adminCashRefundRequestService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

// [GET] 전체 환급 요청 목록 (type 쿼리 파라미터로 분기)
router.get('/all/refund', async (req, res) => {
  try {
    // type이 없으면 기본값을 'all'로 설정
    const type = req.query.type || 'all';
    console.log('🚀 ~ router.get ~ type:', type);

    const result = await adminCashRefundRequestService.getAllRefundRequests(type);
    res.status(200).json({ message: '환급 요청 조회 성공', data: result });
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

// [GET] 캐시 환급 내역 (type 쿼리 파라미터로 분기)
router.get('/refund/history', async (req, res) => {
  try {
    const type = req.query.type || 'all';
    const result = await adminCashRefundRequestService.getCashRefundHistory(type);
    res.status(200).json({ message: '캐시 환급 내역 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
