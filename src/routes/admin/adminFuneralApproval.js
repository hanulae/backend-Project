/**
 * 관리자 장례식장 가입 승인 라우터
 * - 장례식장 가입 요청 목록 조회, 제출 문서 조회, 승인/거절 처리 기능을 제공합니다.
 * - 모든 엔드포인트는 관리자 인증이 필요합니다.
 */

import express from 'express'; // Express 라우팅
import * as funeralApprovalService from '../../services/admin/adminFuneralApprovalService.js'; // 가입 승인 관련 비즈니스 로직
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js'; // 관리자 인증 미들웨어(JWT 검증)

/** 라우터 인스턴스 생성 */
const router = express.Router();

/**
 * 모든 라우트에 관리자 인증 미들웨어 적용
 * - 이후 정의되는 모든 엔드포인트는 인증을 통과해야 접근 가능
 */
router.use(adminAuthMiddleware);

/**
 * [GET] /admin/funeralApproval/requests
 * 장례식장 가입 요청 목록 조회 (상태별 그룹화: 승인됨/요청중)
 *
 * Response:
 * - 200 OK: { message: '가입 요청 목록 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
router.get('/requests', async (req, res) => {
  try {
    const result = await funeralApprovalService.getGroupedFuneralList();
    res.status(200).json({ message: '가입 요청 목록 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/funeralApproval/requests/file/:funeralId
 * 특정 장례식장의 추가 제출 문서(파일) 조회
 *
 * Path Params:
 * - funeralId: string (장례식장 ID)
 *
 * Response:
 * - 200 OK: { message: '장례식장 추가파일 조회 성공', data: Object }
 * - 404 Not Found: 등록된 파일이 없는 경우
 * - 500 Internal Server Error
 */
router.get('/requests/file/:funeralId', async (req, res) => {
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

/**
 * [PATCH] /admin/funeralApproval/requests/approve/:funeralId
 * 장례식장 가입 승인/거절 처리 및 결과 SMS 발송
 *
 * Path Params:
 * - funeralId: string (장례식장 ID)
 *
 * Request Body:
 * - isApproved: boolean (true=승인, false=거절)
 * - message?: string (거절 사유 또는 승인 메시지; isApproved=false일 때 필수)
 *
 * 동작:
 * - 입력 검증(불리언 여부, 거절 시 message 필수)
 * - 서비스 계층 호출하여 승인 상태 반영
 * - 결과에 따라 대상자 휴대폰번호 조회 후 승인/거절 SMS 발송
 * - 잘못된 UUID이거나 대상 없음에 대해 적절한 에러 반환
 *
 * Response:
 * - 200 OK: { message: '가입 승인 완료' | '가입 거절 처리 완료', data: Object }
 * - 400 Bad Request: 잘못된 UUID 형식 또는 유효성 오류
 * - 404 Not Found: 존재하지 않는 장례식장 ID
 * - 500 Internal Server Error
 */
router.patch('/requests/approve/:funeralId', async (req, res) => {
  try {
    const { funeralId } = req.params;
    console.log('🚀 ~ router.patch ~ funeralId:', funeralId);
    const { isApproved, message } = req.body;
    console.log('🚀 ~ router.patch ~ isApproved, message:', isApproved, message);

    // isApproved 값 검증
    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ message: 'isApproved는 true 또는 false여야 합니다.' });
    }

    // 거절 처리 시 message 필수
    if (isApproved === false && !message) {
      return res.status(400).json({ message: '거절 메시지가 필요합니다.' });
    }

    const result = await funeralApprovalService.setApprovalStatus(funeralId, isApproved);
    console.log('🚀 ~ router.patch ~ result:', result);

    // 잘못된 UUID 형식
    if (result === 'invalid_uuid') {
      return res.status(400).json({ message: '유효하지 않은 UUID 형식입니다.' });
    }

    // 대상 없음
    if (!result) {
      return res.status(404).json({ message: '존재하지 않는 장례식장 ID입니다.' });
    }

    // 승인/거절 결과에 따른 SMS 발송
    if (isApproved) {
      const funeral = await funeralApprovalService.getFuneralById(funeralId);
      const phoneNumber = funeral.funeralPhoneNumber;
      await funeralApprovalService.sendApprovalSMS(phoneNumber, message);
    } else {
      const funeral = await funeralApprovalService.getFuneralById(funeralId);
      const phoneNumber = funeral.funeralPhoneNumber;
      await funeralApprovalService.sendRejectionSMS(phoneNumber, message);
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
