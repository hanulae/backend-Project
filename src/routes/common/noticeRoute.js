/**
 * 공지사항 공용 라우터
 * - 앱 사용자(상조팀장/장례식장)에게 노출되는 공지 목록/상세 조회 API 제공
 * - 인증 없이 접근 가능한 공개 엔드포인트입니다.
 */
// routes/common/noticeRoute.js
import express from 'express';
import * as noticeService from '../../services/common/noticeService.js';

const router = express.Router();

/**
 * [GET] /common/notice/list
 * 공지사항 목록 조회
 *
 * Query:
 * - type?: 'manager' | 'funeral' | 'all' (기본값: 'all') — 대상 유형 필터
 *
 * Response:
 * - 200 OK: { message: '공지사항 목록 조회 성공', data: Array }
 * - 400 Bad Request: type 유효성 오류
 * - 500 Internal Server Error
 */
// [GET] 공지사항 목록
router.get('/list', async (req, res) => {
  try {
    const { type = 'all' } = req.query;

    if (!['manager', 'funeral', 'all'].includes(type)) {
      return res.status(400).json({
        message: '유효하지 않은 타입입니다. (manager, funeral, all 중 하나)',
      });
    }

    const list = await noticeService.getNoticeList(type);

    res.status(200).json({ message: '공지사항 목록 조회 성공', data: list });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /common/notice/:noticeId
 * 공지사항 상세 조회
 *
 * Path Params:
 * - noticeId: string (필수)
 *
 * Response:
 * - 200 OK: { message: '공지사항 상세 조회 성공', data: Object }
 * - 404 Not Found: 대상 공지 없음
 */
// [GET] 공지사항 상세
router.get('/:noticeId', async (req, res) => {
  try {
    const detail = await noticeService.getNoticeDetail(req.params.noticeId);
    res.status(200).json({ message: '공지사항 상세 조회 성공', data: detail });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
