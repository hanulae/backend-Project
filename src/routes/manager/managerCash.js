import express from 'express';
import * as managerCashService from '../../services/manager/managerCashService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import { getPortOneToken, verifyPortOnePayment } from '../../utils/portone.js';

const router = express.Router();

// 캐시 충전 - PortOne 결제 검증 포함
router.post('/topup', async (req, res) => {
  try {
    const { imp_uid, amount, managerId } = req.body;

    if (!imp_uid || !amount || !managerId) {
      return res.status(400).json({ message: '필수 정보 누락: imp_uid, amount, managerId' });
    }

    // 1. PortOne 토큰 발급
    const accessToken = await getPortOneToken();

    // 2. PortOne 결제 정보 조회
    const paymentData = await verifyPortOnePayment(accessToken, imp_uid);

    // 3. 결제 금액 일치 확인
    if (paymentData.amount !== amount) {
      return res.status(400).json({ message: '결제 금액 불일치' });
    }

    // 4. DB에 캐시 충전 기록 반영
    const result = await managerCashService.topupCash({
      managerId,
      amount,
      bankTransactionId: imp_uid,
    });

    res.status(201).json({ message: '캐시 충전 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 캐시 환급
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { amountCash } = req.body;
    const managerId = req.user.managerId;

    const params = { managerId, amountCash };
    const result = await managerCashService.requestCashRefund(params);

    res.status(200).json({ message: '환급 요청 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 캐시 사용/적립 내역 조회
router.get('/history/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    const history = await managerCashService.getCashHistory(managerId);
    res.status(200).json({ message: '캐시 히스토리 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
