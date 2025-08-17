/**
 * 관리자 인증 라우터
 * - /admin/auth 하위에서 관리자 로그인/로그아웃 관련 API를 제공합니다.
 * - 응답 메시지는 한국어로 통일되어 있으며, 비즈니스 로직은 service 계층에 위임합니다.
 */

import express from 'express'; // Express 라우터 사용
import * as adminAuthService from '../../services/admin/adminAuthService.js'; // 관리자 인증 비즈니스 로직 (로그인 등)
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js'; // 관리자 인증 미들웨어(JWT 검증, req.user 주입)
import fcmService from '../../services/common/fcmService.js'; // FCM 토큰 관리(비활성화 등)

/** 라우터 인스턴스 생성 */
const router = express.Router();

/**
 * [POST] /admin/auth/login
 * 관리자 로그인
 *
 * Request Body:
 * - adminEmail: string (관리자 이메일)
 * - adminPassword: string (관리자 비밀번호)
 *
 * Response:
 * - 200 OK: 로그인 성공 메시지와 함께 인증 관련 데이터(예: 토큰, 관리자 정보 등)를 반환
 * - 401 Unauthorized: 자격 증명이 올바르지 않은 경우
 */
router.post('/login', async (req, res) => {
  try {
    const { adminEmail, adminPassword } = req.body;
    const result = await adminAuthService.loginAdmin({ adminEmail, adminPassword });

    res.status(200).json({ message: '로그인 성공', ...result });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

/**
 * [POST] /admin/auth/logout
 * 관리자 로그아웃 (인증 필요)
 *
 * Headers:
 * - Authorization: Bearer <JWT 토큰>
 *
 * Request Body (optional):
 * - deviceId?: string (해당 기기만 로그아웃하려는 경우 제공)
 *
 * 동작:
 * - 인증 미들웨어를 통과해 req.user에서 userId, userType 추출
 * - FCM 토큰 비활성화:
 *   - deviceId가 제공되면 해당 기기의 토큰만 비활성화
 *   - deviceId가 없으면 모든 기기의 토큰 비활성화
 * - FCM 비활성화에 실패해도 로그아웃 처리는 계속 진행
 *
 * Response:
 * - 200 OK: 로그아웃 성공
 * - 500 Internal Server Error: 서버 내부 오류
 */
router.post('/logout', adminAuthMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { deviceId } = req.body; // 선택적으로 특정 기기만 로그아웃

    // FCM 토큰 비활성화
    try {
      await fcmService.deactivateUserTokens({
        userId,
        userType,
        deviceId, // deviceId가 없으면 모든 토큰 비활성화
      });
    } catch (fcmError) {
      console.warn('FCM 토큰 비활성화 실패:', fcmError.message);
      // FCM 오류가 있어도 로그아웃은 계속 진행
    }

    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
