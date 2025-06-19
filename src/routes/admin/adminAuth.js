import express from 'express';
import * as adminAuthService from '../../services/admin/adminAuthService.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { adminEmail, adminPassword } = req.body;
    const result = await adminAuthService.loginAdmin({ adminEmail, adminPassword });

    res.status(200).json({ message: '로그인 성공', ...result });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
});

export default router;
