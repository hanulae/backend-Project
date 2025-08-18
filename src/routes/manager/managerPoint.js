/**
 * 상조팀장 포인트 라우터
 * - 포인트 환급 요청(포인트→캐시), 포인트 내역 조회, 현재 포인트 조회 기능 제공
 * - 일부 엔드포인트는 인증 미들웨어가 필요합니다.
 */
import express from 'express';
import * as pointService from '../../services/manager/managerPointService.js';
import authMiddleware from '../../middlewares/authMiddleware.js'; // JWT 인증 미들웨어

const router = express.Router();

/**
 * [POST] /manager/point/refund
 * 포인트 환급 요청 (인증 필요) — 포인트를 캐시로 전환 요청
 *
 * Body:
 * - amountPoint: number (필수) — 전환할 포인트 양
 *
 * 동작:
 * - 토큰에서 managerId 추출 후 전환 요청 처리
 *
 * Response:
 * - 200 OK: { message: '포인트 환급 요청 성공', data: Object }
 * - 500 Internal Server Error
 */
// 포인트 환급 요청
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { amountPoint } = req.body;
    const managerId = req.user.managerId; // ✅ JWT 토큰에서 추출

    const result = await pointService.requestPointToCash(managerId, amountPoint);
    res.status(200).json({ message: '포인트 환급 요청 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /manager/point/history
 * 포인트 사용/적립 내역 조회 (공개)
 *
 * Query:
 * - managerId: string (필수)
 * - page?: number (기본값 1)
 * - limit?: number (기본값 10)
 *
 * Response:
 * - 200 OK: { message: '포인트 내역 조회 성공', ...paginationResult }
 * - 500 Internal Server Error
 */
// 포인트 사용/적립 내역
router.get('/history', async (req, res) => {
  try {
    const { managerId, page = 1, limit = 10 } = req.query;
    const result = await pointService.getPointHistory(managerId, page, limit);
    res.status(200).json({ message: '포인트 내역 조회 성공', ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /manager/point/current
 * 현재 포인트 조회 (인증 필요)
 *
 * Response:
 * - 200 OK: { message: '현재 포인트 조회 성공', currentPoint: number }
 * - 500 Internal Server Error
 */
// 현재 포인트 조회
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const managerId = req.user.managerId;
    const currentPoint = await pointService.getCurrentPoint(managerId);
    res.status(200).json({ message: '현재 포인트 조회 성공', currentPoint });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
