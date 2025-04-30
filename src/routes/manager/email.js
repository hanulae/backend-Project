import express from 'express';
import logger from '../../config/logger.js';
import { sendVerificationEmail, verifyEmailCode } from '../../services/manager/emailService.js';
const router = express.Router();

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
