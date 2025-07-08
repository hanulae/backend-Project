import express from 'express';
import * as funeralSMSService from '../../services/funeral/funeralSMSService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
const router = express.Router();

router.post('/send/staff', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;
    const { funeralPhone } = req.body;
    if (!funeralPhone) return res.status(400).json({ message: '전화번호 필요' });

    await funeralSMSService.sendVerificationSMSStaff(funeralPhone, funeralId);
    res.status(200).json({ message: '인증번호 발송 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/verify/staff', async (req, res) => {
  try {
    const { funeralPhone, code } = req.body;
    if (!funeralPhone || !code) return res.status(400).json({ message: '필수값 누락' });

    const isVerified = await funeralSMSService.verifyCodeStaff(funeralPhone, code);
    if (isVerified) {
      res.status(200).json({ message: '인증 성공', verified: true });
    } else {
      res.status(400).json({ message: '인증 실패', verified: false });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//휴대폰 인증 번호 발송
router.post('/send/funeral', async (req, res) => {
  try {
    const { funeralPhone } = req.body;
    if (!funeralPhone) return res.status(400).json({ message: '필수값 누락' });

    const cleanedPhoneNumber = funeralPhone.replace(/-/g, '');

    await funeralSMSService.sendVerificationSMSFuneral(cleanedPhoneNumber);

    res.status(200).json({ message: '인증번호 발송 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/verify/funeral', async (req, res) => {
  try {
    const { funeralPhone, code } = req.body;

    if (!funeralPhone || !code) return res.status(400).json({ message: '필수값 누락' });

    const isVerified = await funeralSMSService.verifyCodeFuneral(funeralPhone, code);
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
