import express from 'express';
import * as funeralAuthService from '../../services/funeral/funeralAuthService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// 로그인
router.post('/login', async (req, res) => {
  try {
    const result = await funeralAuthService.login(req.body);
    res.status(200).json({ message: '로그인 성공', ...result });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  try {
    // 프론트에서 토큰 제거로 처리됨
    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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

// 비밀번호 분실 시 비밀번호 변경
router.patch('/update/password/lost', async (req, res) => {
  try {
    const { phoneNumber, newPassword } = req.body;

    const params = { phoneNumber, newPassword };

    await funeralAuthService.lostPasswordUpdate(params);

    res.json({ message: '비밀번호 변경 완료' });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error.message);
    res.status(400).json({ message: error.message });
  }
});

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
