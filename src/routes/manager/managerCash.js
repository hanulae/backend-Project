/**
 * 상조팀장 캐시 라우터 (후개발 예정 API 리스트)
 * - 현재 상조팀장 캐시 기능은 미개발 상태이며, 이후 개발 시 아래 API 시그니처를 기반으로 구현 예정입니다.
 * - 본 라우터는 문서화를 위한 스켈레톤이며, 실제 결제 검증/캐시 처리 로직은 추후 구현(또는 교체)됩니다.
 * - 주의: 현재 운영에서 사용하지 않습니다(후개발).
 */
import express from 'express';
import * as managerCashService from '../../services/manager/managerCashService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';
import { getPortOneToken, verifyPortOnePayment } from '../../utils/portone.js';

const router = express.Router();

/**
 * [POST] /manager/cash/topup
 * 캐시 충전 (후개발 예정 / 현재 미사용)
 *
 * Body(예시 스펙):
 * - imp_uid: string (필수) — 외부 결제 트랜잭션 식별자
 * - amount: number (필수) — 결제/충전 금액
 * - managerId: string (필수) — 충전 대상 상조팀장 ID
 *
 * 비고:
 * - 실제 결제 검증/정합성 확인 로직은 추후 구현 시 확정됩니다.
 */
// 캐시 충전 (후개발 예정 / 현재 미사용)
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

/**
 * [POST] /manager/cash/refund
 * 캐시 환급 요청 (후개발 예정 / 현재 미사용)
 *
 * Body(예시 스펙):
 * - amountCash: number (필수)
 *
 * 비고:
 * - 환급 승인/정산 흐름은 추후 정책에 맞춰 구현됩니다.
 */
// 캐시 환급 (후개발 예정 / 현재 미사용)
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;
    console.log('🚀 ~ router.post ~ managerId:', managerId);
    const { amountCash } = req.body;
    console.log('🚀 ~ router.post ~ amountCash:', amountCash);

    const params = { managerId, amountCash };

    const result = await managerCashService.requestCashRefund(params);
    res.status(200).json({ message: '캐쉬 환급 요청 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /manager/cash/history/list
 * 캐시 사용/적립 내역 조회 (후개발 예정 / 현재 미사용)
 *
 * 비고:
 * - 조회 파라미터(기간/정렬/페이지네이션 등)는 구현 시 확정됩니다.
 */
// 캐시 사용/적립 내역 조회 (후개발 예정 / 현재 미사용)
router.get('/history/list', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const history = await managerCashService.getCashHistory(managerId);
    res.status(200).json({ message: '캐시 히스토리 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /manager/cash/current
 * 현재 캐시 조회 (후개발 예정 / 현재 미사용)
 *
 * 비고:
 * - 실시간 잔액 산정 방식은 추후 데이터 모델 확정 후 구현됩니다.
 */
// 현재 캐시 조회 (후개발 예정 / 현재 미사용)
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const currentCash = await managerCashService.getCurrentCash(managerId);
    res.status(200).json({ message: '현재 캐쉬 조회 성공', currentCash });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
