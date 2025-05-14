import express from 'express';
import { sendVerificationSMS, verifyCode } from '../../services/funeral/funeralSMSService.js';
const router = express.Router();

router.post('/send-verification', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ message: '전화번호 필요' });

    await sendVerificationSMS(phoneNumber);
    res.status(200).json({ message: '인증번호 발송 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code) return res.status(400).json({ message: '필수값 누락' });

    const isValid = await verifyCode(phoneNumber, code);
    res.status(200).json({ message: '인증 성공', isValid });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
