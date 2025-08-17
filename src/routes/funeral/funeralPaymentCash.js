/**
 * 장례식장 캐시 결제(PortOne/아임포트) 라우터
 * - PortOne(아임포트) 결제 사전등록, 웹훅 처리, 결제 검증을 제공합니다.
 * - 사전등록은 인증 필요, 웹훅/검증은 서버-서버 용도로 인증 없이 처리됩니다.
 */
import express from 'express';
import * as paymentService from '../../services/funeral/funeralPaymentCashService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * [POST] /funeral/payment/prepare
 * PortOne(아임포트) 결제 사전등록 (인증 필요)
 *
 * Body:
 * - merchantUid: string (필수) — 가맹점 주문번호
 * - amount: number (필수) — 결제 금액
 *
 * 동작:
 * - 토큰에서 funeralId 추출 후, PortOne 사전등록 API 호출에 필요한 정보를 서비스 계층에 위임합니다.
 *
 * Response:
 * - 200 OK: { success: true, result: Object }
 * - 500 Internal Server Error
 */
router.post('/prepare', authMiddleware, async (req, res) => {
  const { merchantUid, amount } = req.body;
  const { funeralId } = req.user;

  try {
    const result = await paymentService.preparePayment({
      merchantUid,
      amount,
      funeralId,
    });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Payment Prepare Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

/**
 * [POST] /funeral/payment/webhook
 * PortOne(아임포트) 웹훅 수신 처리 (비인증, 서버-서버 콜백)
 *
 * Body:
 * - imp_uid: string (필수) — PortOne 고유 결제건 ID
 * - merchant_uid: string (필수) — 가맹점 주문번호
 * - status: string (필수) — 결제 상태(예: paid, cancelled 등)
 *
 * 동작:
 * - 수신한 웹훅 데이터로 결제 상태를 서비스 계층에서 갱신/검증합니다.
 *
 * Response:
 * - 200 OK: { success: true, result: Object }
 * - 500 Internal Server Error
 */
router.post('/webhook', async (req, res) => {
  const { imp_uid, merchant_uid, status } = req.body;

  try {
    const result = await paymentService.processWebhook({ imp_uid, merchant_uid, status });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

/**
 * [POST] /funeral/payment/verify
 * PortOne(아임포트) 결제 검증 (비인증, 서버-서버 검증용)
 *
 * Body:
 * - imp_uid: string (필수)
 * - merchant_uid: string (필수)
 * - amount: number (필수)
 *
 * 동작:
 * - PortOne 결제건(imp_uid)의 실제 결제 금액과 가맹점 측 금액/주문번호를 대조하여 무결성 검증을 수행합니다.
 *
 * Response:
 * - 200 OK: { success: true, result: Object }
 * - 500 Internal Server Error
 */
router.post('/verify', async (req, res) => {
  const { imp_uid, merchant_uid, amount } = req.body;
  try {
    const result = await paymentService.verifyPayment({ imp_uid, merchant_uid, amount });
    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

export default router;
