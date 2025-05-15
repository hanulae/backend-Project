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
router.patch('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const managerId = req.user.id;
    await managerAuthService.updatePassword(managerId, currentPassword, newPassword);
    res.json({ message: '비밀번호 변경 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 휴대폰 번호 변경
router.patch('/phone-number', authMiddleware, async (req, res) => {
  try {
    const { phone } = req.body;
    const managerId = req.user.id;
    await managerAuthService.updatePhoneNumber(managerId, phone);
    res.json({ message: '휴대폰 번호 변경 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 계좌번호 변경
router.patch('/bank-account', authMiddleware, async (req, res) => {
  try {
    const { bankName, bankNumber } = req.body;
    const managerId = req.user.id;
    await managerAuthService.updateBankAccount(managerId, bankName, bankNumber);
    res.json({ message: '계좌정보 변경 완료' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 이메일 찾기
router.post('/find-email', async (req, res) => {
  try {
    const { name, phone } = req.body;
    const result = await managerAuthService.findEmailByNameAndPhone(name, phone);
    if (result) {
      res.json({ email: result.managerEmail });
    } else {
      res.status(404).json({ message: '일치하는 정보가 없습니다.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 관리자 승인 API
router.patch('/approve/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    const result = await managerAuthService.approveManager(managerId);
    res.status(200).json({ message: '회원가입 승인 완료', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
