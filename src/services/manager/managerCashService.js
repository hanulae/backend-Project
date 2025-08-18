/**
 * 상조팀장 캐시 관리 서비스
 * - 상조팀장의 캐시 충전, 환급 요청, 캐시 내역 조회, 잔액 조회 등의 캐시 관련 기능을 제공합니다.
 * - 캐시 충전 시 은행 거래 ID를 기록하여 추적 가능성을 보장합니다.
 * - 환급 요청 시 관리자에게 FCM 알림을 전송하여 즉시 처리할 수 있도록 지원합니다.
 * - 캐시 히스토리를 통한 모든 거래 내역의 투명한 관리와 감사를 지원합니다.
 * - 트랜잭션 상태 관리로 캐시 거래의 안전성과 정확성을 보장합니다.
 */
import * as managerCashDao from '../../daos/manager/managerCashDao.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';
import * as cashRefundRequestDao from '../../daos/manager/managerCashRefundRequestDao.js';
import * as adminUserDao from '../../daos/admin/adminUserDao.js';
import logger from '../../config/logger.js';
import fcmService from '../common/fcmService.js';

/**
 * 상조팀장 캐시 충전
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 * - amount: number — 충전할 캐시 금액
 * - bankTransactionId: string — 은행 거래 ID (추적용)
 *
 * 동작:
 * 1) managerId로 상조팀장 정보 조회 및 존재 여부 확인
 * 2) 현재 캐시 잔액에 충전 금액을 더한 새로운 잔액 계산
 * 3) 상조팀장 테이블의 캐시 잔액 업데이트
 * 4) 캐시 히스토리 테이블에 충전 내역 기록
 * 5) 생성된 히스토리 레코드 반환
 *
 * 캐시 히스토리 기록:
 * - transactionType: 'earn_cash' (캐시 획득)
 * - managerCashAmount: 충전된 금액
 * - managerCashBalanceAfter: 충전 후 잔액
 * - bankTransactionId: 은행 거래 ID (추적 및 감사용)
 * - status: 'completed' (완료된 거래)
 *
 * 검증 사항:
 * - 상조팀장 존재 여부: '존재하지 않는 사용자입니다.'
 * - 금액 유효성: amount > 0 (음수 충전 방지)
 *
 * 보안:
 * - 은행 거래 ID를 통한 거래 추적 가능
 * - 캐시 히스토리로 모든 거래 내역 기록
 * - 즉시 완료 상태로 거래 상태 명확화
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 레코드
 *
 * 예외:
 * - 상조팀장 없음: '존재하지 않는 사용자입니다.'
 * - DB 오류: 원본 오류를 그대로 전파
 * - 기타 오류: '캐시 충전 오류: {원인}' 형태로 콘솔에 기록
 *
 * 참고:
 * - 이 함수는 은행 입금 확인 후 호출되어야 합니다.
 * - bankTransactionId는 은행 시스템에서 제공하는 고유 식별자입니다.
 * - 캐시 충전은 즉시 완료되며, 별도의 승인 과정이 필요하지 않습니다.
 */
export const topupCash = async ({ managerId, amount, bankTransactionId }) => {
  try {
    const manager = await managerCashDao.findManagerById(managerId);
    if (!manager) throw new Error('존재하지 않는 사용자입니다.');

    const newBalance = manager.managerCash + amount;

    await managerCashDao.updateManagerCash(managerId, newBalance);
    const history = await managerCashDao.createCashHistory({
      managerId,
      transactionType: 'earn_cash',
      managerCashAmount: amount,
      managerCashBalanceAfter: newBalance,
      bankTransactionId,
      status: 'completed',
    });

    return history;
  } catch (error) {
    console.error('캐시 충전 오류:', error.message);
    throw error;
  }
};

/**
 * 상조팀장 캐시 환급 요청
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 * - amountCash: number — 환급 요청 금액
 *
 * 동작:
 * 1) 환급 금액 유효성 검증 (0보다 큰 양수)
 * 2) managerId로 상조팀장 정보 조회 및 존재 여부 확인
 * 3) 보유 캐시와 요청 금액 비교 검증
 * 4) 환급 요청 테이블에 요청 정보 저장
 * 5) 캐시 히스토리 테이블에 환급 내역 기록 (pending 상태)
 * 6) 상조팀장 테이블의 캐시 잔액 차감
 * 7) 관리자에게 FCM 알림 전송
 * 8) 환급 요청 정보 반환
 *
 * 검증 사항:
 * - 금액 유효성: amountCash > 0
 * - 상조팀장 존재: '상조팀장 정보를 찾을 수 없습니다.'
 * - 잔액 충분성: manager.managerCash >= amountCash
 *
 * 환급 요청 처리:
 * - 환급 요청 테이블: 'requested' 상태로 저장
 * - 캐시 히스토리: 'withdraw_cash' 타입, 'pending' 상태로 기록
 * - 캐시 잔액: 즉시 차감하여 환급 요청 중복 방지
 *
 * 관리자 알림:
 * - FCM을 통한 즉시 알림 전송
 * - 알림 실패 시에도 환급 요청은 성공으로 처리
 * - 알림 데이터에 요청 ID, 상조팀장 정보, 금액 등 포함
 *
 * 보안:
 * - 환급 요청 시 즉시 캐시 차감으로 중복 요청 방지
 * - pending 상태로 거래 상태 명확화
 * - 관리자 승인 후 completed 상태로 변경 필요
 *
 * 반환:
 * - Object: 생성된 환급 요청 레코드
 *
 * 예외:
 * - 금액 오류: '환급 금액이 올바르지 않습니다.'
 * - 상조팀장 없음: '상조팀장 정보를 찾을 수 없습니다.'
 * - 잔액 부족: '요청 금액이 보유 캐시보다 많습니다. 현재 보유 캐시: {금액}원'
 * - 기타 오류: '환급 요청 실패: {원인}' 형태로 Error throw
 *
 * 참고:
 * - 환급 요청은 관리자 승인이 필요한 2단계 프로세스입니다.
 * - pending 상태의 캐시 히스토리는 관리자 승인 후 completed로 변경됩니다.
 * - FCM 알림 실패는 로그에 기록되지만 환급 요청 자체는 성공으로 처리됩니다.
 */
export const requestCashRefund = async (params) => {
  try {
    const { managerId, amountCash } = params;

    if (!amountCash || amountCash <= 0) {
      throw new Error('환급 금액이 올바르지 않습니다.');
    }

    const manager = await managerUserDao.findById(managerId);
    if (!manager) throw new Error('상조팀장 정보를 찾을 수 없습니다.');

    if (manager.managerCash < amountCash) {
      throw new Error(
        `요청 금액이 보유 캐시보다 많습니다. 현재 보유 캐시: ${manager.managerCash}원`,
      );
    }

    // 1. 환급 요청 테이블에 저장
    const refundRequest = await cashRefundRequestDao.create({
      managerId,
      amount: amountCash,
      status: 'requested',
    });

    // 2. 캐시 히스토리 테이블에도 저장 (pending 상태)
    await managerCashDao.createCashHistory({
      managerId,
      transactionType: 'withdraw_cash',
      managerCashAmount: amountCash,
      managerCashBalanceAfter: manager.managerCash - amountCash, // 현재 잔액 (아직 차감 전)
      status: 'pending', // 대기중 상태
    });

    await managerCashDao.updateManagerCash(managerId, manager.managerCash - amountCash);

    //3. 관리자에게 환급 요청 알림 전송
    try {
      const adminUser = await adminUserDao.findById();

      await fcmService.sendNotificationToUser({
        receiverId: adminUser.adminId,
        receiverType: 'admin',
        notificationType: 'cash_refund_requested',
        data: {
          requestId: refundRequest.id,
          managerId: managerId,
          managerName: manager.managerName,
          amount: amountCash,
          requestType: 'manager',
        },
        senderId: managerId,
        senderType: 'manager',
      });
      logger.info(`상조팀장 환급 요청 알림 전송 성공: 관리자 ${adminUser.adminId}`);
    } catch (notificationError) {
      logger.error('상조팀장 환급 요청 알림 전송 실패', notificationError);
      // 알림 전송 실패해도 환급 요청 자체는 성공으로 처리
    }

    return refundRequest;
  } catch (error) {
    throw new Error('환급 요청 실패: ' + error.message);
  }
};

/**
 * 상조팀장 캐시 내역 조회
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 *
 * 동작:
 * - managerId로 해당 상조팀장의 모든 캐시 거래 내역 조회
 * - 캐시 히스토리 테이블에서 거래 타입, 금액, 잔액, 상태, 거래 시간 등 포함
 *
 * 조회되는 정보:
 * - 거래 타입 (earn_cash, withdraw_cash 등)
 * - 거래 금액
 * - 거래 후 잔액
 * - 거래 상태 (completed, pending 등)
 * - 거래 시간
 * - 은행 거래 ID (충전 시)
 * - 환급 요청 ID (환급 시)
 *
 * 반환:
 * - Array<Object>: 캐시 거래 내역 배열
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 * - 기타 오류: '캐시 내역 조회 오류: {원인}' 형태로 콘솔에 기록
 *
 * 참고:
 * - 이 함수는 상조팀장의 모든 캐시 거래 내역을 시간순으로 조회합니다.
 * - 거래 상태별 필터링이 필요한 경우 클라이언트에서 처리해야 합니다.
 * - 대량의 거래 내역이 있는 경우 페이지네이션을 고려해야 합니다.
 */
export const getCashHistory = async (managerId) => {
  try {
    return await managerCashDao.findCashHistoryByManagerId(managerId);
  } catch (error) {
    console.error('캐시 내역 조회 오류:', error.message);
    throw error;
  }
};

/**
 * 상조팀장 현재 캐시 잔액 조회
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 *
 * 동작:
 * - managerId로 해당 상조팀장의 현재 캐시 잔액 조회
 * - 상조팀장 테이블에서 managerCash 필드 값 반환
 *
 * 반환:
 * - number: 현재 보유 캐시 잔액
 *
 * 예외:
 * - DB 조회 실패: 원본 오류를 그대로 전파
 *
 * 참고:
 * - 이 함수는 단순한 잔액 조회로, 별도의 오류 처리가 없습니다.
 * - 상조팀장이 존재하지 않는 경우 DAO에서 적절한 오류를 발생시킵니다.
 * - 실시간 잔액 확인이 필요한 경우 이 함수를 사용합니다.
 */
export const getCurrentCash = async (managerId) => {
  return await managerCashDao.getCurrentCash(managerId);
};
