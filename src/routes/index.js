/**
 * API 루트 라우터
 * - 서비스 전역의 하위 도메인 라우터들을 한 곳에 모아 마운트합니다.
 * - 실제 엔드포인트는 각 하위 라우터 파일에서 정의되며, 이곳에서는 경로만 연결합니다.
 */
import express from 'express';

import managerRoutes from './manager/managerIndex.js';
import funeralRoutes from './funeral/funeralIndex.js';
import adminRoutes from './admin/adminIndex.js';
import commonRoutes from './common/commonIndex.js';

const router = express.Router();

// router.get('/', (req, res) => {
//   res.send('안녕하세요');
// });

// 하위 도메인 라우터 마운트
// - /manager: 상조팀장 관련 인증/사용자/포인트/캐시/문서/배차 등
router.use('/manager', managerRoutes);
// - /funeral: 장례식장 관련 인증/사용자/포인트·캐시/문서/배차/승인 등
router.use('/funeral', funeralRoutes);
// - /admin: 관리자 인증·스태프/승인/공지/캐시/환급/배차 등 백오피스 기능
router.use('/admin', adminRoutes);
// - /common: 공용 인증 유지, 공지 조회, 알림 등 크로스 도메인 기능
router.use('/common', commonRoutes);

export default router;
