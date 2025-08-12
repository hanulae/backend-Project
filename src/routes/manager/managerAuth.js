/**
 * 상조팀장 인증/계정 관리 라우터
 * - 로그인/로그아웃, 비밀번호/휴대폰/계좌 정보 변경, 아이디 찾기(SMS 인증) 기능 제공
 * - 일부 엔드포인트는 인증 미들웨어가 필요합니다.
 */
import express from 'express';
import * as managerAuthService from '../../services/manager/managerAuthService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import fcmService from '../../services/common/fcmService.js';

const router = express.Router();

/**
 * [POST] /manager/auth/login
 * 로그인
 *
 * Body:
 * - managerUsername: string (필수)
 * - managerPassword: string (필수)
 *
 * Response:
 * - 200 OK: { message: '로그인 성공', ...result } // 토큰, 사용자 정보 등 포함
 * - 401 Unauthorized: 인증 실패
 */
// 로그인
router.post('/login', async (req, res) => {
  try {
    const { managerUsername, managerPassword } = req.body;
    const result = await managerAuthService.loginManager({ managerUsername, managerPassword });
    res.status(200).json({ message: '로그인 성공', ...result });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

/**
 * [POST] /manager/auth/logout
 * 로그아웃 (인증 필요)
 *
 * Body:
 * - deviceId?: string (선택, 제공 시 해당 기기만 로그아웃)
 *
 * 동작:
 * - FCM 토큰 비활성화 시도(오류가 나도 로그아웃은 지속)
 * - accessToken/refreshToken 쿠키 삭제
 *
 * Response:
 * - 200 OK: { message: '로그아웃 성공' }
 * - 500 Internal Server Error
 */
// 로그아웃
router.post('/logout', authMiddleware, async (req, res) => {
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

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [PATCH] /manager/auth/update/password
 * 비밀번호 변경 (인증 필요)
 *
 * Body:
 * - newPassword: string (필수)
 *
 * Response:
 * - 200 OK: { message: '비밀번호 변경 완료' }
 * - 400 Bad Request
 */
// 비밀번호 변경
router.patch('/update/password', authMiddleware, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const managerId = req.user.managerId;

    const params = { managerId, newPassword };

    await managerAuthService.updatePassword(params);

    res.json({ message: '비밀번호 변경 완료' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * [PATCH] /manager/auth/update/password/lost
 * 비밀번호 분실 시 비밀번호 변경
 *
 * Body:
 * - phoneNumber: string (필수)
 * - newPassword: string (필수)
 *
 * Response:
 * - 200 OK: { message: '비밀번호 변경 완료' }
 * - 400 Bad Request
 */
// 비밀번호 분실 시 비밀번호 변경
router.patch('/update/password/lost', async (req, res) => {
  try {
    const { phoneNumber, newPassword } = req.body;

    const params = { phoneNumber, newPassword };

    await managerAuthService.lostPasswordUpdate(params);

    res.json({ message: '비밀번호 변경 완료' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * [PATCH] /manager/auth/update/phone
 * 휴대폰 번호 변경 (인증 필요)
 *
 * Body:
 * - currentPhone: string (필수)
 * - newPhone: string (필수)
 *
 * Response:
 * - 200 OK: { message: '휴대폰 번호 변경 완료', manager: Object }
 * - 400 Bad Request
 */
// 휴대폰 번호 변경
router.patch('/update/phone', authMiddleware, async (req, res) => {
  try {
    const { currentPhone, newPhone } = req.body;
    const managerId = req.user.managerId;

    const params = { managerId, currentPhone, newPhone };
    const updatedManager = await managerAuthService.updatePhoneNumber(params);

    res.status(200).json({
      message: '휴대폰 번호 변경 완료',
      manager: updatedManager.toSafeObject ? updatedManager.toSafeObject() : updatedManager,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [PATCH] /manager/auth/update/bank-number
 * 계좌 정보 변경 (인증 필요)
 *
 * Body:
 * - managerBankName: string (필수)
 * - managerBankNumber: string (필수, 숫자만 허용)
 * - managerBankHolder: string (필수)
 *
 * Response:
 * - 200 OK: { message: '계좌 정보 변경 완료', data: Object }
 * - 400 Bad Request: 형식 오류 등
 */
// 계좌 정보 변경
router.patch('/update/bank-number', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const { managerBankName, managerBankNumber, managerBankHolder } = req.body;

    // 유효성 검사: 숫자 형식 체크
    if (!/^\d+$/.test(managerBankNumber)) {
      return res.status(400).json({ message: '계좌번호는 숫자만 입력 가능합니다.' });
    }

    const params = { managerId, managerBankName, managerBankNumber, managerBankHolder };
    const updatedManager = await managerAuthService.updateBankAccount(params);

    res.status(200).json({
      message: '계좌 정보 변경 완료',
      data: updatedManager,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /manager/auth/find/username/send
 * 아이디 찾기용 SMS 인증코드 전송 (공개)
 *
 * Body:
 * - managerPhoneNumber: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증 코드가 전송되었습니다.' }
 * - 400 Bad Request
 */
// SMS 인증코드 전송
router.post('/find/username/send', async (req, res) => {
  try {
    const { managerPhoneNumber } = req.body;
    if (!managerPhoneNumber) {
      return res.status(400).json({ message: '전화번호를 입력해주세요.' });
    }

    await managerAuthService.sendVerificationSMS(managerPhoneNumber);
    res.status(200).json({ message: '인증 코드가 전송되었습니다.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /manager/auth/find/username/verify
 * 인증코드 검증 후 아이디 찾기 (공개)
 *
 * Body:
 * - managerPhone: string (필수)
 * - code: string (필수)
 * - userType?: string (선택, 서비스 정책에 따라 사용)
 *
 * Response:
 * - 200 OK: { message: '인증 성공', verified: true, username: string }
 * - 400 Bad Request: { message: '인증 실패', verified: false }
 */
// 인증코드 검증 후 아이디 찾기
router.post('/find/username/verify', async (req, res) => {
  try {
    const { managerPhone, code, userType } = req.body;
    if (!managerPhone || !code) {
      return res.status(400).json({ message: '전화번호와 인증코드를 모두 입력해주세요.' });
    }

    const isVerified = await managerAuthService.verifyCode(managerPhone, code, userType);

    if (isVerified) {
      res.status(200).json({ message: '인증 성공', verified: true, username: isVerified });
    } else {
      res.status(400).json({ message: '인증 실패', verified: false });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
