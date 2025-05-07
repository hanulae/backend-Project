import express from 'express';
import uploadManagerFile from '../../middlewares/uploadManagerFile.js';
import * as managerUserService from '../../services/manager/managerUserService.js';

const router = express.Router();

router.post('/signup', uploadManagerFile, async (req, res) => {
  try {
    const params = {
      managerEmail: req.body.managerEmail,
      managerPassword: req.body.managerPassword,
      managerName: req.body.managerName,
      managerPhone: req.body.managerPhone,
      managerBankName: req.body.managerBankName,
      managerBankNumber: req.body.managerBankNumber,
      file: req.file,
    };

    const result = await managerUserService.registerManager(params);

    res.status(201).json({
      message: '상조팀장 회원가입이 완료되었습니다.',
      manager: result,
    });
  } catch (error) {
    console.error('회원가입 오류:', error.message);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

export default router;
