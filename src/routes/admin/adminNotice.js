/**
 * 관리자 공지사항 라우터
 * - 공지 등록/수정/삭제 및 목록 조회 API를 제공합니다.
 * - 모든 엔드포인트는 관리자 인증이 필요합니다.
 */
import express from 'express';
import * as adminNoticeService from '../../services/admin/adminNoticeService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

/**
 * 모든 라우트에 관리자 인증 미들웨어 적용
 * - 이후 정의되는 모든 엔드포인트는 인증을 통과해야 접근 가능합니다.
 */
// 관리자 인증 미들웨어 적용
router.use(adminAuthMiddleware);

/**
 * [POST] /admin/notice/add/create
 * 공지사항 등록
 *
 * Body:
 * - title: string (필수)
 * - content: string (필수)
 * - isVisible?: boolean (기본값 true)
 * - userType: string (필수, 대상 사용자 유형)
 *
 * Response:
 * - 201 Created: { message: '공지사항 등록 성공', data: Object }
 * - 400 Bad Request: 필수값 누락 등 유효성 오류
 * - 500 Internal Server Error
 */
// [POST] 공지사항 등록
router.post('/add/create', async (req, res) => {
  try {
    const { title, content, isVisible, userType } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
    }
    if (!userType) {
      return res.status(400).json({ message: '공지사항 대상(userType)을 입력해주세요.' });
    }

    const newNotice = await adminNoticeService.createNotice({
      title,
      content,
      isVisible: isVisible ?? true,
      userType, // 추가
    });

    res.status(201).json({ message: '공지사항 등록 성공', data: newNotice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [PATCH] /admin/notice/update/:noticeId
 * 공지사항 수정
 *
 * Path Params:
 * - noticeId: string
 *
 * Body:
 * - title?: string
 * - content?: string
 * - isVisible?: boolean
 * - userType?: string
 *
 * Response:
 * - 200 OK: { message: '공지사항 수정 성공', data: Object }
 * - 404 Not Found: 대상 공지 없음
 * - 500 Internal Server Error
 */
// 수정 추가
router.patch('/update/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { title, content, isVisible, userType } = req.body;
    console.log(
      '🚀 ~ router.patch ~ title, content, isVisible, userType:',
      title,
      content,
      isVisible,
      userType,
    );

    const updated = await adminNoticeService.updateNotice(noticeId, {
      title,
      content,
      isVisible,
      userType,
    });

    if (!updated) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '공지사항 수정 성공', data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [DELETE] /admin/notice/delete/:noticeId
 * 공지사항 삭제
 *
 * Path Params:
 * - noticeId: string
 *
 * Response:
 * - 200 OK: { message: '공지사항 삭제 성공' }
 * - 404 Not Found: 대상 공지 없음
 * - 500 Internal Server Error
 */
// 삭제 추가
router.delete('/delete/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const result = await adminNoticeService.deleteNotice(noticeId);

    if (!result) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '공지사항 삭제 성공' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /admin/notice/list
 * 공지사항 전체 목록 조회 (필터링 지원)
 *
 * Query:
 * - userType?: string — 대상 사용자 유형으로 필터링
 * - isVisible?: boolean — 노출 여부로 필터링
 *
 * Response:
 * - 200 OK: { message: '공지사항 목록 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
// [GET] 공지사항 전체 조회 (userType, isVisible 등 쿼리로 필터링 가능)
router.get('/list', async (req, res) => {
  try {
    const { userType, isVisible } = req.query; // 쿼리 파라미터로 필터링

    const notices = await adminNoticeService.getNoticeList({ userType, isVisible });

    res.status(200).json({ message: '공지사항 목록 조회 성공', data: notices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
