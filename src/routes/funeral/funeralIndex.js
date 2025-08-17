/**
 * 장례식장 도메인 라우터 인덱스
 * - 장례식장 관련 하위 라우터들을 경로에 마운트합니다.
 * - 실제 엔드포인트는 각 하위 라우터 파일에서 정의되며, 이곳에서는 경로만 연결합니다.
 */
import express from 'express';
import managerFormByFuneral from './managerFormByFuneral.js';
import funeralHallInfo from './funeralHallInfo.js';
import funeralAuth from './funeralAuth.js';
import funeralEmail from './funeralEmail.js';
import funeralSMS from './funeralSMS.js';
import funeralAccount from './funeralAccount.js';
import funeralUser from './funeralUser.js';
import funeralStaff from './funeralStaff.js';
import funeralCash from './funeralCash.js';
import funeralDispatchRequest from './funeralDispatchRequest.js';
import funeralPoint from './funeralPoint.js';
import funeralList from './funeralList.js';
import withdrawalRoutes from './funeralWithdrawal.js';
import funeralPaymentCash from './funeralPaymentCash.js';

const router = express.Router();
// 하위 라우터 마운트
router.use('/auth', funeralAuth); // 인증(로그인/로그아웃/정보 변경 등)
router.use('/email', funeralEmail); // 이메일 인증(현재 미사용/후개발 가능)
router.use('/sms', funeralSMS); // SMS 인증(발송/검증)
router.use('/account', funeralAccount); // 계좌 소유자 확인
router.use('/user', funeralUser); // 회원가입/아이디 중복/프로필
router.use('/staff', funeralStaff); // 직원 관리(생성/수정/삭제/목록/로그인/로그아웃)
router.use('/form', managerFormByFuneral); // 장례식장 입찰/견적 폼
router.use('/hall', funeralHallInfo); // 장례식장 정보 관리
router.use('/cash', funeralCash); // 캐시 충전/환급/내역/현재 캐시
router.use('/point', funeralPoint); // 포인트 전환/내역/현재 포인트
router.use('/request', funeralDispatchRequest); // 출동(배차) 요청
router.use('/funeralList', funeralList); // 장례식장 상세/이미지 등 리스트
router.use('/withdrawal', withdrawalRoutes); // 회원탈퇴(검증/실행)
router.use('/payment', funeralPaymentCash); // 결제(PortOne) 사전등록/웹훅/검증

export default router;
