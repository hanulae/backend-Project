/**
 * 관리자 지급(포인트/캐시 등) 라우터
 * - 특정 대상에게 포인트/캐시를 지급하는 API를 제공합니다.
 * - 모든 엔드포인트는 관리자 인증이 필요합니다.
 */

import express from 'express'; // Express 라우팅
import * as grantService from '../../services/admin/grantService.js'; // 지급 처리 비즈니스 로직
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js'; // 관리자 인증 미들웨어(JWT 검증)

/** 라우터 인스턴스 생성 */
const router = express.Router();

/**
 * 모든 라우트에 관리자 인증 미들웨어 적용
 * - 이후 정의되는 모든 엔드포인트는 인증을 통과해야 접근 가능
 */
router.use(adminAuthMiddleware);

/**
 * [POST] /admin/grant/charge
 * 포인트/캐시 등 보상을 특정 대상에게 지급
 *
 * Request Body:
 * - targetType: string (지급 대상 종류, 예: 'manager' | 'funeral' 등 서비스 정책에 따름)
 * - targetId: string (지급 대상의 고유 ID)
 * - type: string (지급 종류, 예: 'point' | 'cash' 등)
 * - amount: number (지급 금액/포인트)
 *
 * 동작:
 * - 전달받은 파라미터를 서비스 계층으로 위임하여 지급 처리 수행
 *
 * Response:
 * - 200 OK: { message: '<type> 지급 성공', data: Object }
 * - 500 Internal Server Error
 */
router.post('/charge', async (req, res) => {
  try {
    const { targetType, targetId, type, amount } = req.body;

    const params = { targetType, targetId, type, amount };

    const result = await grantService.grantReward(params);
    res.status(200).json({ message: `${type} 지급 성공`, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
