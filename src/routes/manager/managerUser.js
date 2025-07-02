import express from 'express';
import uploadManagerFile from '../../middlewares/uploadManagerFile.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import * as managerUserService from '../../services/manager/managerUserService.js';
import { deleteS3Object } from '../../config/s3.js'; // AWS S3 연결 모듈

const router = express.Router();

router.post('/signup', uploadManagerFile, async (req, res) => {
  try {
    const params = {
      managerUsername: req.body.managerUsername,
      managerPassword: req.body.managerPassword,
      managerName: req.body.managerName,
      managerPhoneNumber: req.body.managerPhone,
      managerBankName: req.body.managerBankName,
      managerBankNumber: req.body.managerBankNumber,
      files: req.files,
    };

    const result = await managerUserService.registerManager(params);
    res.status(201).json({
      message: '상조팀장 회원가입이 완료되었습니다.',
      manager: result,
    });
  } catch (error) {
    console.error('회원가입 오류:', error.message);
    // ✅ 실패 시 S3에 업로드된 파일 삭제
    if (req.files?.location) {
      await deleteS3Object(req.files.location);
    }
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 아이디 중복 확인
router.get('/checkUsername', async (req, res) => {
  try {
    const { userName } = req.query;
    const isAvailable = await managerUserService.isUsernameAvailable(userName);

    res.status(200).json({
      message: isAvailable ? '사용 가능한 아이디입니다.' : '이미 사용 중인 아이디입니다.',
      available: isAvailable,
    });
  } catch (error) {
    console.error('아이디 중복 확인 오류:', error.message);
    res.status(500).json({ message: '아이디 중복 확인 중 오류가 발생했습니다.' });
  }
});

// 내 프로필 조회
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const profile = await managerUserService.getMyProfile(managerId);

    if (!profile) {
      return res.status(404).json({ message: '프로필 정보를 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '프로필 조회 성공', data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
