import express from 'express';
import { sendVerificationSMS, verifyCode } from '../../services/funeral/funeralSMSService.js';
const router = express.Router();

router.post('/send', async (req, res) => {
  try {
    const { funeralPhone } = req.body;
    if (!funeralPhone) return res.status(400).json({ message: '전화번호 필요' });

    await sendVerificationSMS(funeralPhone);
    res.status(200).json({ message: '인증번호 발송 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { funeralPhone, code } = req.body;
    if (!funeralPhone || !code) return res.status(400).json({ message: '필수값 누락' });
    console.log('🚀 ~ router.post ~ code:', code);
    console.log('🚀 ~ router.post ~ funeralPhone:', funeralPhone);

    const isVerified = await verifyCode(funeralPhone, code);
    if (isVerified) {
      res.status(200).json({ message: '인증 성공', verified: true });
    } else {
      res.status(400).json({ message: '인증 실패', verified: false });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
