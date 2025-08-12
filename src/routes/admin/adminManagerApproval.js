import express from 'express';
import * as managerApprovalService from '../../services/admin/adminManagerApprovalService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

/**
 * 모든 요청에 관리자 인증 미들웨어 적용
 * - 이후 정의되는 모든 엔드포인트는 인증을 통과해야 접근 가능
 */
router.use(adminAuthMiddleware);

/**
 * [GET] /admin/manager/requests
 * 상조팀장 가입 요청 목록 조회 (상태별 그룹화: 승인/요청)
 *
 * Response:
 * - 200 OK: { message: '가입 요청 목록 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
router.get('/requests', async (req, res) => {
  try {
    const result = await managerApprovalService.getGroupedManagerList();
    res.status(200).json({ message: '가입 요청 목록 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/manager/requests/file/:managerId
 * 특정 상조팀장의 등록 파일(추가 제출 문서) 조회
 *
 * Path Params:
 * - managerId: string (상조팀장 ID)
 *
 * Response:
 * - 200 OK: { message: '상조팀장 추가파일 조회 성공', data: Object }
 * - 404 Not Found: 등록된 파일이 없는 경우
 * - 500 Internal Server Error
 */
router.get('/requests/file/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    const file = await managerApprovalService.getManagerDocument(managerId);

    if (!file) {
      return res.status(404).json({ message: '등록된 파일이 없습니다.' });
    }

    res.status(200).json({ message: '상조팀장 추가파일 조회 성공', data: file });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [PATCH] /admin/manager/requests/approve/:managerId
 * 상조팀장 가입 승인/거절 처리 및 결과 SMS 발송
 *
 * Path Params:
 * - managerId: string (상조팀장 ID)
 *
 * Request Body:
 * - isApproved: boolean (true=승인, false=거절)
 * - message?: string (거절 사유 또는 안내 메시지; isApproved=false일 때 필수)
 *
 * 동작:
 * - 입력 검증(불리언 여부, 거절 시 message 필수)
 * - 서비스 계층 처리 후 대상자 휴대폰번호 조회하여 승인/거절 SMS 발송
 *
 * Response:
 * - 200 OK: { message: '가입 승인 완료' | '가입 거절 처리 완료', data: Object }
 * - 400 Bad Request: 유효성 오류 (isApproved 타입 오류, 거절 사유 누락 등)
 * - 500 Internal Server Error
 */
router.patch('/requests/approve/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    console.log('🚀 ~ router.patch ~ managerId:', managerId);
    const { isApproved, message } = req.body;
    console.log('🚀 ~ router.patch ~ isApproved, message:', isApproved, message);

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ message: 'isApproved는 true 또는 false여야 합니다.' });
    }

    if (!isApproved && !message) {
      return res.status(400).json({ message: '거절 메시지가 필요합니다.' });
    }

    const result = await managerApprovalService.setApprovalStatus(managerId, isApproved);

    if (isApproved) {
      const manager = await managerApprovalService.getManagerById(managerId);
      const phoneNumber = manager.managerPhoneNumber;
      await managerApprovalService.sendApprovalSMS(phoneNumber, message);
    } else {
      const manager = await managerApprovalService.getManagerById(managerId);
      const phoneNumber = manager.managerPhoneNumber;
      await managerApprovalService.sendRejectionSMS(phoneNumber, message);
    }

    res
      .status(200)
      .json({ message: isApproved ? '가입 승인 완료' : '가입 거절 처리 완료', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
