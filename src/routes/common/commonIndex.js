/**
 * 공용(Common) 도메인 라우터 인덱스
 * - 공지, 인증 유지/검증, 알림 등 서비스 전역에서 공통으로 사용하는 하위 라우터를 마운트합니다.
 * - 실제 엔드포인트는 각 하위 라우터에 정의되며, 이 파일에서는 경로 연결만 담당합니다.
 */
import express from 'express';
import noticeRoute from './noticeRoute.js';
import authValidationRouter from './authValidationRouter.js';
import notificationRoute from './notificationRoute.js';

const router = express.Router();

// 공통 라우트 설정
router.use('/notice', noticeRoute); // 공지사항 목록/상세 조회(공개)
router.use('/auth', authValidationRouter); // 로그인 유지/토큰 재발급(매니저/장례식장/관리자)
router.use('/notification', notificationRoute); // 알림(푸시/히스토리 등) 관련 공용 API

export default router;
