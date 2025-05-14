import express from 'express';
import { verifyAccountOwner } from '../../services/funeral/funeralAccountService.js';
const router = express.Router();

router.post('/verify', async (req, res) => {
  try {
    const result = await verifyAccountOwner(req.body);
    res.status(200).json({ message: '계좌 확인 성공', data: result });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
