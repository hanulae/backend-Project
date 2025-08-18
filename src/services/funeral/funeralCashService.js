/**
 * 장례식장 캐시 관리 서비스
 * - 장례식장의 캐시 충전, 환급 요청, 잔액 조회, 거래 내역 관리 기능을 제공합니다.
 * - 트랜잭션 기반으로 캐시 잔액과 거래 내역의 정합성을 보장합니다.
 * - 환급 요청 시 관리자에게 FCM 알림을 발송합니다.
 * - 현재 PortOne 결제 연동은 미구현 상태이며, 향후 개발 예정입니다.
 */
//import { getPortOneToken, verifyPortOnePayment } from '../../utils/portone.js';
import * as funeralCashHistoryDao from '../../daos/funeral/funeralCashHistoryDao.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashDao.js';
import db from '../../models/index.js';
import logger from '../../config/logger.js';
import fcmService from '../common/fcmService.js';

/**
 * 캐시 충전
 *
 * 입력:
 * - amountCash: number — 충전할 캐시 금액
 * - funeralId: string — 장례식장 ID
 *
 * 동작:
 * 1) 트랜잭션 시작
 * 2) PortOne 결제 검증 (현재 주석 처리됨)
 * 3) 장례식장 정보 조회 및 존재 여부 확인
 * 4) 기존 캐시 잔액에 충전 금액 추가
 * 5) 장례식장 테이블의 캐시 잔액 업데이트
 * 6) 캐시 충전 이력 기록 (earn_cash 타입)
 * 7) 트랜잭션 커밋
 *
 * 반환:
 * - Object: 생성된 캐시 히스토리 레코드
 *
 * 예외:
 * - 장례식장 없음: '장례식장 정보가 존재하지 않습니다.'
 * - PortOne 검증 실패: 결제 금액 불일치 시 오류 (현재 미사용)
 * - DB 오류: 트랜잭션 롤백 후 원본 오류 전파
 *
 * 참고:
 * - PortOne 결제 연동 로직이 주석 처리되어 있어 실제 결제 검증은 수행되지 않습니다.
 * - 향후 결제 시스템 연동 시 주석을 해제하고 적절한 검증 로직을 구현해야 합니다.
 */
export const topupCash = async ({ amountCash, funeralId }) => {
  const transaction = await db.sequelize.transaction();
  try {
    //const token = await getPortOneToken();
    // const paymentData = await verifyPortOnePayment(token, imp_uid);

    // if (paymentData.amount !== amountCash) {
    //   throw new Error('결제 금액이 일치하지 않습니다.');
    // }

    const funeral = await db.Funeral.findByPk(funeralId, { transaction });
    if (!funeral) throw new Error('장례식장 정보가 존재하지 않습니다.');

    const newBalance = funeral.funeralCash + amountCash;

    await db.Funeral.update({ funeralCash: newBalance }, { where: { funeralId }, transaction });

    const cashHistory = await funeralCashHistoryDao.create(
      {
        funeralId,
        transactionType: 'earn_cash',
        funeralCashAmount: amountCash,
        funeralCashBalanceAfter: newBalance,
        status: 'completed',
      },
      { transaction },
    );

    await transaction.commit();
    return cashHistory;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * 캐시 환급 요청
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 * - amountCash: number — 환급 요청 금액
 *
 * 동작:
 * 1) 환급 요청 금액 유효성 검증 (양수, 0 초과)
 * 2) 장례식장 정보 조회 및 존재 여부 확인
 * 3) 보유 캐시 잔액과 환급 요청 금액 비교 검증
 * 4) 환급 요청 이력 생성 (withdraw_cash 타입, pending 상태)
 * 5) 관리자에게 FCM 알림 발송 (환급 요청 정보 포함)
 * 6) 환급 요청 결과 반환
 *
 * 검증 사항:
 * - amountCash > 0: 환급 요청 금액은 양수여야 함
 * - funeral.funeralCash >= amountCash: 보유 캐시가 환급 요청 금액보다 많아야 함
 *
 * 반환:
 * - Object: 생성된 환급 요청 히스토리 레코드
 *
 * 예외:
 * - 잘못된 금액: '환급 요청 금액이 올바르지 않습니다.'
 * - 장례식장 없음: '장례식장 정보를 찾을 수 없습니다.'
 * - 잔액 부족: '환급 요청 금액이 보유 캐시보다 많습니다. 현재 보유 캐시: {금액}원'
 * - 알림 전송 실패: 로깅만 수행하고 환급 요청 자체는 성공 처리
 *
 * 알림 정보:
 * - 관리자에게 전송되는 알림에는 요청 ID, 장례식장 정보, 금액, 요청 유형이 포함됩니다.
 * - 알림 전송 실패 시에도 환급 요청은 정상적으로 처리됩니다.
 */
export const requestCashRefund = async ({ funeralId, amountCash }) => {
  try {
    if (!amountCash || amountCash <= 0) {
      throw new Error('환급 요청 금액이 올바르지 않습니다.');
    }

    const funeral = await funeralCashHistoryDao.findFuneralById(funeralId);
    if (!funeral) throw new Error('장례식장 정보를 찾을 수 없습니다.');

    if (funeral.funeralCash < amountCash) {
      throw new Error(
        `환급 요청 금액이 보유 캐시보다 많습니다. 현재 보유 캐시: ${funeral.funeralCash}원`,
      );
    }

    const refundRequest = await funeralCashHistoryDao.createCashHistory({
      funeralId,
      transactionType: 'withdraw_cash',
      funeralCashAmount: amountCash,
      funeralCashBalanceAfter: funeral.funeralCash - amountCash,
      status: 'pending',
    });

    // 관리자에게 환급 요청 알림 전송
    try {
      const adminUserDao = await import('../../daos/admin/adminUserDao.js');
      const adminUser = await adminUserDao.findById();

      if (!adminUser) {
        logger.warn('관리자 계정을 찾을 수 없어 알림 전송을 건너뜁니다.');
      } else {
        await fcmService.sendNotificationToUser({
          receiverId: adminUser.adminId,
          receiverType: 'admin',
          notificationType: 'cash_refund_requested',
          data: {
            requestId: refundRequest.id,
            funeralId: funeralId,
            funeralName: funeral.funeralName,
            amount: amountCash,
            requestType: 'funeral',
          },
          senderId: funeralId,
          senderType: 'funeral',
        });
        logger.info(`장례식장 환급 요청 알림 전송 성공: 관리자 ${adminUser.adminId}`);
      }
    } catch (notificationError) {
      logger.error('장례식장 환급 요청 알림 전송 실패', notificationError);
      // 알림 전송 실패해도 환급 요청 자체는 성공으로 처리
    }

    return refundRequest;
  } catch (error) {
    throw new error('🔴 장례식장 환급 요청 실패:', error.message);
  }
};

/**
 * 캐시 거래 내역 조회
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 *
 * 동작:
 * - DAO를 통해 해당 장례식장의 모든 캐시 거래 내역을 조회합니다.
 *
 * 반환:
 * - Array<CashHistory>: 캐시 거래 내역 배열
 *
 * 예외:
 * - 조회 실패 시 원본 오류를 그대로 전파합니다.
 * - 오류 발생 시 console.error로 로깅합니다.
 */
export const getCashHistory = async (funeralId) => {
  try {
    return await funeralCashDao.findCashHistoryByFuneralId(funeralId);
  } catch (error) {
    console.error('캐시 내역 조회 오류:', error.message);
    throw error;
  }
};

/**
 * 현재 캐시 잔액 조회
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 *
 * 동작:
 * - DAO를 통해 해당 장례식장의 현재 캐시 잔액을 조회합니다.
 *
 * 반환:
 * - number: 현재 캐시 잔액
 *
 * 예외:
 * - 조회 실패 시 DAO에서 발생한 오류를 그대로 전파합니다.
 */
export const getCurrentCash = async (funeralId) => {
  return await funeralCashDao.getCurrentCash(funeralId);
};

/**
 * 회원별 캐시 충전 내역 조회
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 *
 * 동작:
 * - DAO를 통해 해당 장례식장의 캐시 거래 내역을 조회합니다.
 * - getCashHistory와 동일한 기능을 제공하지만, 오류 메시지가 다릅니다.
 *
 * 반환:
 * - Array<CashHistory>: 캐시 거래 내역 배열
 *
 * 예외:
 * - 조회 실패 시 '회원별 캐시 충전 내역 조회 실패: {원인}' 형태로 Error throw
 *
 * 참고:
 * - getCashHistory와 기능적으로 동일하지만, 오류 처리 방식이 다릅니다.
 * - 향후 코드 정리 시 중복 함수를 제거하는 것을 권장합니다.
 */
export const getCashHistoryByUser = async (funeralId) => {
  try {
    return await funeralCashDao.findCashHistoryByFuneralId(funeralId);
  } catch (error) {
    throw new Error('회원별 캐시 충전 내역 조회 실패: ' + error.message);
  }
};
