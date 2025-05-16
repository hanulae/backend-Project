import express from 'express';
import * as funeralAuthService from '../../services/funeral/funeralAuthService.js';

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
router.patch('/password', async (req, res) => {
  try {
    const { funeralId, newPassword } = req.body;
    const result = await funeralAuthService.updatePassword(funeralId, newPassword);
    res.status(200).json({ message: '비밀번호가 변경되었습니다.', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 전화번호 변경
router.patch('/phone', async (req, res) => {
  try {
    const { funeralId, newPhone } = req.body;
    const result = await funeralAuthService.updatePhone(funeralId, newPhone);
    res.status(200).json({ message: '전화번호가 변경되었습니다.', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 계좌번호 변경
router.patch('/account', async (req, res) => {
  try {
    const { funeralId, bankName, bankNumber } = req.body;
    const result = await funeralAuthService.updateAccount(funeralId, bankName, bankNumber);
    res.status(200).json({ message: '계좌번호가 변경되었습니다.', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 이메일 찾기
router.post('/find-email', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const email = await funeralAuthService.findEmailByPhone(phoneNumber);
    res.status(200).json({ message: '이메일 조회 성공', email });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
