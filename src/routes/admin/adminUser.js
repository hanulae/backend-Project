/**
 * 관리자 사용자 관리 라우터
 * - 전체 유저 목록 조회 및 특정 유저 상세 조회 API 제공
 * - 모든 엔드포인트는 관리자 인증이 필요합니다.
 */
import express from 'express';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';
import * as adminUserService from '../../services/admin/adminUserService.js';

const router = express.Router();

/**
 * 모든 라우트에 관리자 인증 미들웨어 적용
 * - 이후 정의되는 모든 엔드포인트는 인증을 통과해야 접근 가능합니다.
 */
// 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

/**
 * [GET] /admin/user/userList
 * 전체 유저 목록 조회 (유형별 필터 가능)
 *
 * Query:
 * - type?: 'manager' | 'funeral' | 'all' (기본값: 'all')
 *
 * Response:
 * - 200 OK: { message: string(역할별 메시지), data: Array }
 * - 500 Internal Server Error
 */
// 전체 유저 목록 조회
router.get('/userList', async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    const result = await adminUserService.getUsersByType(type);

    let message = '전체 유저 목록 조회 성공';
    if (type === 'manager') message = '상조팀장 목록 조회 성공';
    if (type === 'funeral') message = '장례식장 목록 조회 성공';

    res.status(200).json({ message, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/user/search/:userId
 * 특정 유저 정보 조회 (상조팀장/장례식장)
 *
 * Path Params:
 * - userId: string (필수)
 *
 * Query:
 * - type: 'manager' | 'funeral' (필수)
 *
 * Response:
 * - 200 OK: { message: string(역할별 메시지), data: Object }
 * - 400 Bad Request: type 누락/유효성 오류
 * - 500 Internal Server Error
 */
// 특정 유저 정보 조회
router.get('/search/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({
        message: 'type 파라미터가 필요합니다. (manager 또는 funeral)',
      });
    }

    if (!['manager', 'funeral'].includes(type)) {
      return res.status(400).json({
        message: '유효하지 않은 타입입니다. (manager 또는 funeral)',
      });
    }

    const result = await adminUserService.getUserById(userId, type);

    let message = '유저 정보 조회 성공';
    if (type === 'manager') message = '상조팀장 정보 조회 성공';
    if (type === 'funeral') message = '장례식장 정보 조회 성공';

    res.status(200).json({
      message,
      data: result,
    });
  } catch (error) {
    console.error('특정 유저 정보 조회 오류:', error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
