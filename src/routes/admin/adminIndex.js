/**
 * 관리자 라우터 인덱스
 * - 관리자 관련 하위 라우터들을 한 곳에서 집계(mount)합니다.
 * - 이 파일에서 각 기능별 하위 라우터를 경로에 연결합니다.
 */

import express from 'express'; // Express 라우터
import managerApprovalRouter from './adminManagerApproval.js'; // 상조팀장 승인/관리
import funeralApprovalRouter from './adminFuneralApproval.js'; // 장례식장 가입 승인/문서 조회
import grantRouter from './adminGrant.js'; // 포인트/캐시 지급
import adminCashRefundRequestRouter from './adminCashRefundRequest.js'; // 캐시 환급 요청/처리/내역
import adminUserRouter from './adminUser.js'; // 관리자용 사용자 관리
import adminAuthRouter from './adminAuth.js'; // 관리자 인증(로그인/로그아웃)
import adminStaff from './adminStaff.js'; // 관리자 스태프/권한 관리
import adminCashRouter from './adminCash.js'; // 캐시 충전 내역/지급 조회
import adminDispatchRequestRouter from './adminDispatchRequest.js'; // 배차(요청) 관련 관리
import adminFormByFuneralRouter from './adminFormByFuneral.js'; // 장례식장별 양식/폼 관리
import adminNoticeRouter from './adminNotice.js'; // 공지사항 관리

/** 라우터 인스턴스 생성 */
const router = express.Router();

/**
 * 하위 라우터 마운트
 * - 여기서 설정하는 경로는 상위에서 이 인덱스 라우터가 마운트된 베이스 경로 기준의 하위 경로입니다.
 */
router.use('/manager', managerApprovalRouter); // 상조팀장 승인/목록/처리
router.use('/funeral', funeralApprovalRouter); // 장례식장 가입 승인/제출파일/처리
router.use('/grant', grantRouter); // 포인트/캐시 지급
router.use('/refund', adminCashRefundRequestRouter); // 환급 요청 조회/승인/거절/내역
router.use('/user', adminUserRouter); // 사용자 조회/관리
router.use('/auth', adminAuthRouter); // 관리자 로그인/로그아웃
router.use('/staff', adminStaff); // 스태프 및 권한 관리
router.use('/cash', adminCashRouter); // 캐시 충전/지급 내역
router.use('/dispatch', adminDispatchRequestRouter); // 배차 요청 관련 기능
router.use('/form', adminFormByFuneralRouter); // 장례식장별 폼/문서 관리
router.use('/notice', adminNoticeRouter); // 공지사항 CRUD

export default router;
