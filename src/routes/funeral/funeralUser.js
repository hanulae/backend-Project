import express from 'express';
import * as funeralUserService from '../../services/funeral/funeralUserService.js';
import uploadFuneralFile from '../../middlewares/uploadFuneralFile.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

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

// 내 프로필 조회
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const profile = await funeralUserService.getMyProfile(funeralId);

    if (!profile) {
      return res.status(404).json({ message: '프로필 정보를 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '프로필 조회 성공', data: profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
export default router;
