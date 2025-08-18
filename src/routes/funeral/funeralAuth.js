/**
 * 장례식장 인증/계정 관리 라우터
 * - 로그인/로그아웃, 비밀번호/휴대폰/계좌 정보 변경, 아이디 찾기(SMS 인증) 기능 제공
 * - 일부 엔드포인트는 인증 미들웨어가 필요합니다.
 */
import express from 'express';
import * as funeralAuthService from '../../services/funeral/funeralAuthService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import fcmService from '../../services/common/fcmService.js';

const router = express.Router();

/**
 * [POST] /funeral/auth/login
 * 로그인
 *
 * Body:
 * - funeralUsername: string (필수)
 * - funeralPassword: string (필수)
 *
 * Response:
 * - 200 OK: { message: '로그인 성공', ...result }  // 토큰, 사용자 정보 등 포함
 * - 401 Unauthorized: 인증 실패
 */
// 로그인
router.post('/login', async (req, res) => {
  try {
    const { funeralUsername, funeralPassword } = req.body;
    const result = await funeralAuthService.login({ funeralUsername, funeralPassword });
    res.status(200).json({ message: '로그인 성공', ...result });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/auth/logout
 * 로그아웃 (인증 필요)
 *
 * Body:
 * - deviceId?: string (선택, 제공 시 해당 기기만 로그아웃)
 *
 * 동작:
 * - FCM 토큰 비활성화 시도(오류가 나도 로그아웃은 지속)
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

    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [PATCH] /funeral/auth/update/password
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
    const funeralId = req.user.funeralId;

    const params = { funeralId, newPassword };

    await funeralAuthService.updatePassword(params);

    res.json({ message: '비밀번호 변경 완료' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * [PATCH] /funeral/auth/update/password/lost
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
    console.log('🚀 ~ router.patch ~ phoneNumber, newPassword:', phoneNumber, newPassword);

    const params = { phoneNumber, newPassword };

    await funeralAuthService.lostPasswordUpdate(params);

    res.json({ message: '비밀번호 변경 완료' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error.message);
    res.status(400).json({ message: error.message });
  }
});

/**
 * [PATCH] /funeral/auth/update/phone
 * 휴대폰 번호 변경 (인증 필요)
 *
 * Body:
 * - newPhone: string (필수)
 *
 * Response:
 * - 200 OK: { message: '휴대폰 번호 변경 완료', funeral: Object }
 * - 400 Bad Request
 */
// 휴대폰 번호 변경
router.patch('/update/phone', authMiddleware, async (req, res) => {
  try {
    const { newPhone } = req.body;
    const funeralId = req.user.funeralId;

    const params = { funeralId, newPhone };

    const updatedFuneral = await funeralAuthService.updatePhoneNumber(params);

    res.status(200).json({
      message: '휴대폰 번호 변경 완료',
      funeral: updatedFuneral.toSafeObject ? updatedFuneral.toSafeObject() : updatedFuneral,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [PATCH] /funeral/auth/update/bank-number
 * 계좌 정보 변경 (인증 필요)
 *
 * Body:
 * - funeralBankName: string (필수)
 * - funeralBankNumber: string (필수, 숫자만 허용)
 * - funeralBankHolder: string (필수)
 *
 * Response:
 * - 200 OK: { message: '계좌 정보 변경 완료', data: Object }
 * - 400 Bad Request: 형식 오류 등
 */
// 계좌 정보 변경
router.patch('/update/bank-number', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const { funeralBankName, funeralBankNumber, funeralBankHolder } = req.body;

    // 유효성 검사: 숫자 형식 체크
    if (!/^\d+$/.test(funeralBankNumber)) {
      return res.status(400).json({ message: '계좌번호는 숫자만 입력 가능합니다.' });
    }

    const params = { funeralId, funeralBankName, funeralBankNumber, funeralBankHolder };
    const updatedFuneral = await funeralAuthService.updateBankAccount(params);

    res.status(200).json({
      message: '계좌 정보 변경 완료',
      data: updatedFuneral,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/auth/find/username/send
 * 아이디 찾기용 SMS 인증코드 전송
 *
 * Body:
 * - funeralPhoneNumber: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증 코드가 전송되었습니다.' }
 * - 400 Bad Request
 */
// SMS 인증코드 전송
router.post('/find/username/send', async (req, res) => {
  try {
    const { funeralPhoneNumber } = req.body;
    if (!funeralPhoneNumber) {
      return res.status(400).json({ message: '전화번호를 입력해주세요.' });
    }

    await funeralAuthService.sendVerificationSMS(funeralPhoneNumber);
    res.status(200).json({ message: '인증 코드가 전송되었습니다.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/auth/find/username/verify
 * 인증코드 검증 후 아이디 찾기
 *
 * Body:
 * - funeralPhoneNumber: string (필수)
 * - code: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증 성공', verified: true, username: string }
 * - 400 Bad Request: { message: '인증 실패', verified: false }
 */
// 인증코드 검증 후 아이디 찾기
router.post('/find/username/verify', async (req, res) => {
  try {
    const { funeralPhoneNumber, code } = req.body;
    if (!funeralPhoneNumber || !code) {
      return res.status(400).json({ message: '전화번호와 인증코드를 모두 입력해주세요.' });
    }

    const username = await funeralAuthService.verifyCode(funeralPhoneNumber, code);

    if (username) {
      res.status(200).json({ message: '인증 성공', verified: true, username });
    } else {
      res.status(400).json({ message: '인증 실패', verified: false });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
