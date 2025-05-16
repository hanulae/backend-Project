import express from 'express';
import {
  sendVerificationEmail,
  verifyEmailCode,
} from '../../services/funeral/funeralEmailService.js';
const router = express.Router();

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

router.post('/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: '이메일과 인증 코드가 필요합니다.' });

  const isValid = verifyEmailCode(email, code);
  if (isValid) res.status(200).json({ message: '인증 성공' });
  else res.status(400).json({ message: '인증 실패 또는 만료' });
});

export default router;
