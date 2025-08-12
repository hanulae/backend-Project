/**
 * 장례식장 포인트 라우터
 * - 포인트 → 캐시 전환, 현재 포인트 잔액 조회 기능 제공
 * - 모든 엔드포인트는 인증 미들웨어가 필요합니다.
 */
import express from 'express';
import authMiddleware from '../../middlewares/authMiddleware.js';
import * as funeralPointService from '../../services/funeral/funeralPointService.js';

const router = express.Router();

/**
 * [POST] /funeral/point/convert-to-cash
 * 포인트 → 캐시 전환 (인증 필요)
 *
 * Body:
 * - amount: number (필수) — 전환할 포인트 금액
 *
 * 동작:
 * - 토큰에서 funeralId를 추출하고, 지정한 amount만큼 포인트를 차감하여 캐시로 전환합니다.
 *
 * Response:
 * - 200 OK: { message: '포인트를 캐시로 전환 완료', data: Object }
 * - 400 Bad Request: 유효성/잔액 부족 등 오류
 */
// 포인트 → 캐시 전환 요청
router.post('/convert-to-cash', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const { amount } = req.body;

    const result = await funeralPointService.convertPointToCash({ funeralId, amount });

    res.status(200).json({
      message: '포인트를 캐시로 전환 완료',
      data: result,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/**
 * [GET] /funeral/point/current
 * 현재 포인트 잔액 조회 (인증 필요)
 *
 * Response:
 * - 200 OK: { message: '현재 포인트 조회 성공', currentPoint: number }
 * - 500 Internal Server Error
 */
// 현재 포인트 잔액 조회
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user.funeralId;
    const currentPoint = await funeralPointService.getCurrentPoint(funeralId);
    res.status(200).json({ message: '현재 포인트 조회 성공', currentPoint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
