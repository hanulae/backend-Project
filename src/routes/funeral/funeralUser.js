import express from 'express';
import * as funeralUserService from '../../services/funeral/funeralUserService.js';
import uploadFuneralFile from '../../middlewares/uploadFuneralFile.js';

const router = express.Router();

// 장례식장 회원가입
router.post('/signup', uploadFuneralFile, async (req, res) => {
  try {
    const params = {
      funeralEmail: req.body.funeralEmail,
      funeralPassword: req.body.funeralPassword,
      funeralName: req.body.funeralName,
      funeralPhoneNumber: req.body.funeralPhoneNumber,
      funeralBankName: req.body.funeralBankName,
      funeralBankNumber: req.body.funeralBankNumber,
      funeralBankHolder: req.body.funeralBankHolder,
      file: req.file,
    };

    const result = await funeralUserService.registerFuneral(params);

    res.status(201).json({
      message: '장례식장 회원가입이 완료되었습니다.',
      funeral: result,
    });
  } catch (error) {
    console.error('회원가입 오류:', error.message);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
});

export default router;
