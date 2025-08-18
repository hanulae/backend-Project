/**
 * 관리자 캐시 환급 요청 라우터
 * - /admin/cashRefundRequest 계열의 환급 요청 목록 조회, 승인/거절 처리, 환급 내역 조회 API 제공
 * - 인증이 필요한 관리자 전용 엔드포인트입니다.
 */

import express from 'express'; // Express 라우팅
import * as adminCashRefundRequestService from '../../services/admin/adminCashRefundRequestService.js'; // 환급 요청 관련 비즈니스 로직
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js'; // 관리자 인증 미들웨어(JWT 검증 및 req.user 주입)

/** 라우터 인스턴스 생성 */
const router = express.Router();

/**
 * 모든 하위 라우트에 관리자 인증 미들웨어 적용
 * - 이후 정의되는 모든 엔드포인트는 인증을 통과해야 접근 가능
 */
router.use(adminAuthMiddleware);

/**
 * [GET] /admin/cashRefundRequest/all/refund?type=manager|funeral|all
 * 전체 환급 요청 목록 조회 (유형별 필터)
 *
 * Query:
 * - type: 'manager' | 'funeral' | 'all' (기본값: 'all')
 *
 * Response:
 * - 200 OK: { message: '환급 요청 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
router.get('/all/refund', async (req, res) => {
  try {
    const type = req.query.type || 'all'; // 기본값 all

    const result = await adminCashRefundRequestService.getAllRefundRequests(type);
    res.status(200).json({ message: '환급 요청 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [PATCH] /admin/cashRefundRequest/:type/:requestId
 * 환급 요청 승인/거절 처리
 *
 * Path Params:
 * - type: 'manager' | 'funeral'
 * - requestId: string
 *
 * Request Body:
 * - action: 'approve' | 'reject'
 *
 * 동작:
 * - 서비스 계층에 승인/거절 처리를 위임
 * - 처리 결과에 따라 대상자에게 SMS 발송 (승인/거절 각각 별도 메시지)
 *
 * Response:
 * - 200 OK: { message: '환급 요청이 승인되었습니다.' | '환급 요청이 거절되었습니다.', data: Object }
 * - 400 Bad Request: 잘못된 type 또는 action
 * - 500 Internal Server Error
 */
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

    // 처리 결과에 따른 SMS 발송
    if (action === 'approve') {
      if (type === 'manager') {
        const manager = await adminCashRefundRequestService.getRefundRequestById(requestId, type);
        const phoneNumber = manager.managerPhoneNumber;
        await adminCashRefundRequestService.sendApprovalSMS(
          phoneNumber,
          '환급 요청이 승인되었습니다.',
        );
      } else if (type === 'funeral') {
        const funeral = await adminCashRefundRequestService.getRefundRequestById(requestId, type);
        const phoneNumber = funeral.funeralPhoneNumber;
        await adminCashRefundRequestService.sendApprovalSMS(
          phoneNumber,
          '환급 요청이 승인되었습니다.',
        );
      }
    } else if (action === 'reject') {
      if (type === 'manager') {
        const manager = await adminCashRefundRequestService.getRefundRequestById(requestId, type);
        const phoneNumber = manager.managerPhoneNumber;
        await adminCashRefundRequestService.sendRejectionSMS(
          phoneNumber,
          '환급 요청이 거절되었습니다.',
        );
      } else if (type === 'funeral') {
        const funeral = await adminCashRefundRequestService.getRefundRequestById(requestId, type);
        const phoneNumber = funeral.funeralPhoneNumber;
        await adminCashRefundRequestService.sendRejectionSMS(
          phoneNumber,
          '환급 요청이 거절되었습니다.',
        );
      }
    }

    res.status(200).json({
      message: `환급 요청이 ${action === 'approve' ? '승인' : '거절'}되었습니다.`,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/cashRefundRequest/refund/history?type=manager|funeral|all
 * 캐시 환급 처리 내역 조회 (유형별 필터)
 *
 * Query:
 * - type: 'manager' | 'funeral' | 'all' (기본값: 'all')
 *
 * Response:
 * - 200 OK: { message: '캐시 환급 내역 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
router.get('/refund/history', async (req, res) => {
  try {
    const type = req.query.type || 'all';
    const result = await adminCashRefundRequestService.getCashRefundHistory(type);
    res.status(200).json({ message: '캐시 환급 내역 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/cashRefundRequest/list/refund/:userId?type=manager|funeral
 * 특정 유저의 환급 신청 내역 조회
 *
 * Path Params:
 * - userId: string
 * Query:
 * - type: 'manager' | 'funeral' (필수)
 *
 * Response:
 * - 200 OK: { message: string(역할별 메시지), data: Array }
 * - 400 Bad Request: type 누락/유효성 오류
 * - 500 Internal Server Error
 */
router.get('/list/refund/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        message: 'type 파라미터가 필요합니다. (manager 또는 funeral)',
      });
    }

    if (!['manager', 'funeral'].includes(type)) {
      return res.status(400).json({
        message: '유효하지 않은 타입입니다. (manager 또는 funeral)',
      });
    }

    const result = await adminCashRefundRequestService.getRefundRequestsByUserId(userId, type);

    let message = '환급 신청 내역 조회 성공';
    if (type === 'manager') message = '상조팀장 환급 신청 내역 조회 성공';
    if (type === 'funeral') message = '장례식장 환급 신청 내역 조회 성공';

    res.status(200).json({
      message,
      data: result,
    });
  } catch (error) {
    console.error('특정 유저 환급 신청 내역 조회 오류:', error.message);
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/cashRefundRequest/approved/list/:userId?type=manager|funeral
 * 특정 유저의 승인된 환급 신청 내역 조회
 *
 * Path Params:
 * - userId: string
 * Query:
 * - type: 'manager' | 'funeral' (필수)
 *
 * Response:
 * - 200 OK: { message: string(역할별 메시지), data: Array }
 * - 400 Bad Request: type 누락/유효성 오류
 * - 500 Internal Server Error
 */
router.get('/approved/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        message: 'type 파라미터가 필요합니다. (manager 또는 funeral)',
      });
    }

    if (!['manager', 'funeral'].includes(type)) {
      return res.status(400).json({
        message: '유효하지 않은 타입입니다. (manager 또는 funeral)',
      });
    }

    const result = await adminCashRefundRequestService.getApprovedRefundRequestsByUserId(
      userId,
      type,
    );

    let message = '승인된 환급 신청 내역 조회 성공';
    if (type === 'manager') message = '상조팀장 승인된 환급 신청 내역 조회 성공';
    if (type === 'funeral') message = '장례식장 승인된 환급 신청 내역 조회 성공';

    res.status(200).json({
      message,
      data: result,
    });
  } catch (error) {
    console.error('특정 유저 승인된 환급 신청 내역 조회 오류:', error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
