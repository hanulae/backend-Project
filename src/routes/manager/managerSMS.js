import express from 'express';
import { sendVerificationSMS, verifyCode } from '../../services/manager/managerSmsService.js';

const router = express.Router();

// 인증 코드 전송
router.post('/send', async (req, res) => {
  try {
    const { managerPhone } = req.body;
    if (!managerPhone) {
      return res.status(400).json({ message: '전화번호를 입력해주세요.' });
    }

    await sendVerificationSMS(managerPhone);
    res.status(200).json({ message: '인증 코드가 전송되었습니다.' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 인증 코드 검증
router.post('/verify', async (req, res) => {
  try {
    const { managerPhone, code } = req.body;
    if (!managerPhone || !code) {
      return res.status(400).json({ message: '전화번호와 인증코드를 모두 입력해주세요.' });
    }

    const isVerified = await verifyCode(managerPhone, code);

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
