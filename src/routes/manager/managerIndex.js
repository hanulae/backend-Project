/**
 * 상조팀장 도메인 라우터 인덱스
 * - 상조팀장 관련 하위 라우터들을 경로에 마운트합니다.
 * - 실제 엔드포인트는 각 하위 라우터 파일에서 정의되며, 이곳에서는 경로만 연결합니다.
 */
import express from 'express';
import managerFormRoutes from './managerForm.js';
import managerCartRoutes from './managerCart.js';
import dispatchRequest from './managerDispatchRequest.js';
import emailRoutes from './managerEmail.js';
import bankRoutes from './managerBankAccount.js';
import userRoutes from './managerUser.js';
import authRoutes from './managerAuth.js';
import funeralListRoutes from './managerFuneralList.js';
import pointRoutes from './managerPoint.js';
import cashRoutes from './managerCash.js';
import smsRoutes from './managerSMS.js';
import withdrawalRoutes from './managerWithdrawal.js';

const router = express.Router();

// 하위 라우터 마운트
router.use('/email', emailRoutes); // 이메일 인증 (현재 미사용/후개발 보류)
router.use('/bank', bankRoutes); // 계좌 소유자 확인
router.use('/form', managerFormRoutes); // 견적/입찰 폼 관리
router.use('/cart', managerCartRoutes); // 장바구니 관리
router.use('/request', dispatchRequest); // 출동(배차) 요청
router.use('/user', userRoutes); // 사용자 회원가입/아이디 중복/프로필
router.use('/auth', authRoutes); // 인증(로그인/로그아웃/정보 변경)
router.use('/funeral', funeralListRoutes); // 장례식장 리스트/관련 조회
router.use('/point', pointRoutes); // 포인트 환급/내역/현재 포인트
router.use('/cash', cashRoutes); // 캐시 API (후개발 예정/현재 미사용)
router.use('/sms', smsRoutes); // SMS 인증(공용/변경용)
router.use('/withdrawal', withdrawalRoutes); // 회원탈퇴 절차

export default router;
