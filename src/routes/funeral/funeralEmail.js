/**
 * 장례식장 이메일 인증 라우터
 * - 인증 이메일 발송 및 인증코드 검증 기능 제공
 * - 인증 미들웨어는 적용되어 있지 않습니다.
 * - 추후 개발에 필요 할 수도 있음
 */
import express from 'express';
import {
  sendVerificationEmail,
  verifyEmailCode,
} from '../../services/funeral/funeralEmailService.js';
const router = express.Router();

/**
 * [POST] /funeral/email/send
 * 인증 이메일 발송
 *
 * Body:
 * - email: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증 이메일이 발송되었습니다.' }
 * - 400 Bad Request: 이메일 누락
 * - 500 Internal Server Error: 발송 실패
 */
router.post('/send', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: '이메일이 필요합니다.' });

  try {
    await sendVerificationEmail(email);
    res.status(200).json({ message: '인증 이메일이 발송되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: '이메일 발송 실패', error: error.message });
  }
});

/**
 * [POST] /funeral/email/verify
 * 인증코드 검증
 *
 * Body:
 * - email: string (필수)
 * - code: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증 성공' }
 * - 400 Bad Request: 필수값 누락 또는 인증 실패/만료
 */
router.post('/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: '이메일과 인증 코드가 필요합니다.' });
  console.log('🚀 ~ router.post ~ email, code:', email, code);

  const isValid = verifyEmailCode(email, code);
  if (isValid) res.status(200).json({ message: '인증 성공' });
  else res.status(400).json({ message: '인증 실패 또는 만료' });
});

export default router;
