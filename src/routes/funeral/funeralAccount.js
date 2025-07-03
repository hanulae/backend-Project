import express from 'express';
import { verifyAccountOwner } from '../../services/funeral/funeralAccountService.js';
const router = express.Router();

router.post('/verify', async (req, res) => {
  try {
    const { bankCode, bankNumber, name } = req.body;

    if (!bankCode || !bankNumber || !name) {
      return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
    }

    const result = await verifyAccountOwner({ bankCode, bankNumber, name });
    res.status(200).json({ message: '계좌 확인 성공', data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
