import express from 'express';
import uploadManagerFile from '../../middlewares/uploadManagerFile.js';
import * as managerUserService from '../../services/manager/managerUserService.js';
import { deleteS3Object } from '../../config/s3.js'; // AWS S3 연결 모듈

const router = express.Router();

router.post('/signup', uploadManagerFile, async (req, res) => {
  console.log('🚀 ~ router.post ~ req.body.managerEmail:', req.body.managerEmail);
  try {
    const params = {
      managerEmail: req.body.managerEmail,
      managerPassword: req.body.managerPassword,
      managerName: req.body.managerName,
      managerPhoneNumber: req.body.managerPhone,
      managerBankName: req.body.managerBankName,
      managerBankNumber: req.body.managerBankNumber,
      file: req.file,
    };
    console.log('🚀 ~ router.post ~ params:', params);
    const result = await managerUserService.registerManager(params);
    res.status(201).json({
      message: '상조팀장 회원가입이 완료되었습니다.',
      manager: result,
    });
  } catch (error) {
    console.error('회원가입 오류:', error.message);
    // ✅ 실패 시 S3에 업로드된 파일 삭제
    if (req.file?.location) {
      await deleteS3Object(req.file.location);
    }
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

export default router;
