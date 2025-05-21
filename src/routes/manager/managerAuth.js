import express from 'express';
import * as managerAuthService from '../../services/manager/managerAuthService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { managerEmail, managerPassword } = req.body;
    const result = await managerAuthService.loginManager({ managerEmail, managerPassword });
    res.status(200).json({ message: '로그인 성공', ...result });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// 로그아웃
router.post('/logout', authMiddleware, (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ message: '로그아웃 성공' });
});

// 비밀번호 변경
router.patch('/update/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const managerId = req.user.managerId;

    const params = { managerId, currentPassword, newPassword };

    await managerAuthService.updatePassword(params);

    res.json({ message: '비밀번호 변경 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

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

// SMS 인증코드 전송
router.post('/find/email/send-sms', async (req, res) => {
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

// 인증코드 검증 후 이메일 찾기
router.post('/find/email', async (req, res) => {
  try {
    const { managerPhone, code } = req.body;
    if (!managerPhone || !code) {
      return res.status(400).json({ message: '전화번호와 인증코드를 모두 입력해주세요.' });
    }

    const isVerified = await managerAuthService.verifyCode(managerPhone, code);

    if (isVerified) {
      res.status(200).json({ message: '인증 성공', verified: true, email: isVerified });
    } else {
      res.status(400).json({ message: '인증 실패', verified: false });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
