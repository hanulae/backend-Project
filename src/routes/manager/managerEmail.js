/**
 * 상조팀장 이메일 인증 라우터
 * - 인증 이메일 발송 및 인증 코드 검증 기능 제공
 * - 현재 메일 인증은 사용하지 않으며, 추후 개발에 필요할 수 있어 남겨둔 스켈레톤입니다.
 * - 운영 반영 전, 메일 발송/검증 정책과 보안(레이트리밋·토큰화 등) 검토가 필요합니다.
 */
import express from 'express';
import logger from '../../config/logger.js';
import { sendVerificationEmail, verifyEmailCode } from '../../services/manager/emailService.js';
const router = express.Router();

/**
 * [POST] /manager/email/send
 * 인증 메일 전송 (현재 미사용 / 후개발 보류)
 *
 * Body:
 * - email: string (필수)
 *
 * Response:
 * - 200 OK: { message: '인증 이메일이 발송되었습니다.' }
 * - 400 Bad Request: 이메일 누락
 * - 500 Internal Server Error: 발송 실패
 */
// 인증 메일 전송
router.post('/send', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: '이메일이 필요합니다.' });
  }

  try {
    await sendVerificationEmail(email);
    res.status(200).json({ message: '인증 이메일이 발송되었습니다.' });
  } catch (error) {
    logger.error('이메일 발송 실패:', error.message);
    res.status(500).json({ message: '이메일 발송에 실패했습니다.', error: error.message });
  }
});

/**
 * [POST] /manager/email/verify
 * 인증 코드 확인 (현재 미사용 / 후개발 보류)
 *
 * Body:
 * - email: string (필수)
 * - code: string (필수)
 *
 * Response:
 * - 200 OK: { message: '이메일 인증이 완료되었습니다.' }
 * - 400 Bad Request: 파라미터 누락 또는 코드 만료/불일치
 */
// 인증 코드 확인
router.post('/verify', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: '이메일과 인증 코드가 필요합니다.' });
  }

  const isValid = verifyEmailCode(email, code);
  if (isValid) {
    return res.status(200).json({ message: '이메일 인증이 완료되었습니다.' });
  } else {
    return res.status(400).json({ message: '인증 코드가 유효하지 않거나 만료되었습니다.' });
  }
});
export default router;
