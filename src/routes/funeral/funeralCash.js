/**
 * 장례식장 캐시 라우터
 * - 캐시 충전, 환급 요청, 사용/적립 내역 조회, 현재 캐시 조회 등의 기능을 제공합니다.
 * - 모든 엔드포인트는 인증 미들웨어가 필요합니다.
 */
import express from 'express';
import * as funeralCashService from '../../services/funeral/funeralCashService.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * [POST] /funeral/cash/charge
 * 장례식장 캐시 충전 (인증 필요)
 *
 * Body:
 * - amountCash: number (필수) — 충전할 캐시 금액
 *
 * 동작:
 * - 토큰에서 funeralId를 추출하여 해당 사용자의 캐시를 충전합니다.
 *
 * Response:
 * - 201 Created: { message: '캐시 충전 성공', data: Object }
 * - 500 Internal Server Error
 */
// 장례식장 캐시 충전
// 포트원으로 변경.(개발 테스트 api)
router.post('/charge', authMiddleware, async (req, res) => {
  try {
    // const { imp_uid, amount, funeralId } = req.body;
    const { amountCash } = req.body;
    const { funeralId } = req.user;
    const result = await funeralCashService.topupCash({ amountCash, funeralId });
    res.status(201).json({ message: '캐시 충전 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/cash/refund
 * 캐시 환급 요청 (인증 필요)
 *
 * Body:
 * - amountCash: number (필수) — 환급 요청 캐시 금액
 *
 * Response:
 * - 200 OK: { message: '캐시 환급 요청 성공', data: Object }
 * - 500 Internal Server Error
 */
// 캐시 환급 요청 (장례식장)
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const { amountCash } = req.body;

    const params = { funeralId, amountCash };
    const result = await funeralCashService.requestCashRefund(params);

    res.status(200).json({ message: '캐시 환급 요청 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /funeral/cash/history/list
 * 캐시 사용/적립 내역 조회 (인증 필요)
 *
 * Response:
 * - 200 OK: { message: '캐시 히스토리 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
// 캐시 사용/적립 내역 조회
router.get('/history/list', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const history = await funeralCashService.getCashHistory(funeralId);
    res.status(200).json({ message: '캐시 히스토리 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /funeral/cash/current
 * 현재 캐시 조회 (인증 필요)
 *
 * Response:
 * - 200 OK: { message: '현재 캐쉬 조회 성공', currentCash: number }
 * - 500 Internal Server Error
 */
// 현재 캐시 조회
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const currentCash = await funeralCashService.getCurrentCash(funeralId);
    res.status(200).json({ message: '현재 캐쉬 조회 성공', currentCash });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /funeral/cash/history/:funeralId
 * 회원별 캐시 충전 내역 조회 (인증 필요)
 *
 * Path Params:
 * - funeralId: string (필수)
 *
 * Response:
 * - 200 OK: { message: '회원별 캐시 충전 내역 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
// 회원별 캐시 충전 내역 조회
router.get('/history/:funeralId', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.params;
    const history = await funeralCashService.getCashHistoryByUser(funeralId);
    res.status(200).json({ message: '회원별 캐시 충전 내역 조회 성공', data: history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
