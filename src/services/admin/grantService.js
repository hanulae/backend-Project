/**
 * 관리자 보상(포인트/캐시) 지급 서비스
 * - 대상(상조팀장/장례식장)에게 포인트 또는 캐시를 지급하고, 이력을 기록합니다.
 * - 트랜잭션으로 일괄 처리(잔액 갱신 ↔ 이력 기록)하여 정합성을 보장합니다.
 * - 지급 완료 후 대상자에게 FCM 알림을 발송합니다(실패해도 지급은 성공 처리 유지).
 *
 * 보안/정합성
 * - 입력 파라미터 유효성(양수 금액, 존재하는 대상 등) 검증이 선행되어야 합니다.
 * - 금액은 정수로 관리하는 것을 권장합니다(소수점/반올림 정책 필요 시 서비스 정책에 맞춰 반영).
 * - 동시성: 동일 사용자에 대한 중복 지급 호출이 동시 발생할 수 있으므로 DB 락/낙관적 락/단일 트랜잭션 정책을 고려하세요.
 * - 아이템포턴시: 외부 호출 재시도 대비를 위해 idempotency key 나 중복 이력 방지 로직을 설계할 수 있습니다.
 *
 * 확장/운영
 * - 알림은 실패해도 지급 성공을 유지하며, 실패 로그로 사후 점검합니다(재시도 큐 연동 가능).
 * - 지급 사유/메모, 관리 콘솔 감사 로그(누가/언제/얼마를 지급했는지) 확장이 용이합니다.
 */
import db from '../../models/index.js';
import * as managerPointDao from '../../daos/manager/managerPointHistoryDao.js';
import * as managerCashDao from '../../daos/manager/managerCashHistoryDao.js';
import * as funeralPointDao from '../../daos/funeral/funeralPointHistoryDao.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashHistoryDao.js';
import logger from '../../config/logger.js';
import fcmService from '../common/fcmService.js';

/**
 * 포인트/캐시 지급
 *
 * 입력:
 * - targetType: 'manager' | 'funeral' — 지급 대상 유형
 * - targetId: string — 지급 대상의 PK
 * - type: 'point' | 'cash' — 지급 종류
 * - amount: number — 지급 금액(양수)
 *
 * 전제/제약:
 * - amount > 0 이어야 하며, 단위/반올림 정책은 서비스 정책에 맞춥니다.
 * - 대상자는 유효한 상태여야 하며(탈퇴/정지 등 제외), 호출부에서 사전 검증하는 것을 권장합니다.
 *
 * 동작:
 * 1) 트랜잭션 시작
 * 2) 대상자 조회 및 잔액 계산 → DB 잔액 업데이트(필드: managerPoint/managerCash 또는 funeralPoint/funeralCash)
 * 3) 지급 이력(포인트/캐시 히스토리) 기록
 * 4) 커밋 후 대상자에게 FCM 알림 발송(실패 시 로깅만 수행, 지급 성공에는 영향 없음)
 *
 * 반환:
 * - 생성된 히스토리 레코드(DAO 스키마에 따름)
 *
 * 오류/사이드이펙트:
 * - 대상자 없음, DB 오류 등 발생 시 롤백 후 예외 throw
 * - 알림 실패는 예외로 전파하지 않으며 로그만 남깁니다(사후 재시도/모니터링 권장).
 */
export const grantReward = async ({ targetType, targetId, type, amount }) => {
  const transaction = await db.sequelize.transaction();

  try {
    if (targetType === 'manager') {
      const target = await db.Manager.findByPk(targetId, { transaction });
      if (!target) throw new Error('상조팀장을 찾을 수 없습니다.');

      const field = type === 'point' ? 'managerPoint' : 'managerCash';
      const balance = target[field] + amount;

      await db.Manager.update(
        { [field]: balance },
        { where: { managerId: targetId }, transaction },
      );

      const dao = type === 'point' ? managerPointDao : managerCashDao;
      const data = {
        managerId: targetId,
        transactionType: type === 'point' ? 'earn_point' : 'earn_cash',
        [type === 'point' ? 'managerPointAmount' : 'managerCashAmount']: amount,
        [type === 'point' ? 'managerPointBalanceAfter' : 'managerCashBalanceAfter']: balance,
        status: 'completed',
      };

      const history = await dao.create(data, { transaction });
      await transaction.commit();

      // 상조팀장에게 포인트/캐시 지급 알림 전송
      try {
        // 관리자 정보 조회
        const adminUserDao = await import('../../daos/admin/adminUserDao.js');
        const adminUser = await adminUserDao.findById();
        const adminId = adminUser ? adminUser.adminId : 'admin';

        await fcmService.sendNotificationToUser({
          receiverId: targetId,
          receiverType: 'manager',
          notificationType: type === 'point' ? 'point_granted' : 'cash_granted',
          data: {
            amount: amount,
            balance: balance,
            type: type,
          },
          senderId: adminId,
          senderType: 'admin',
        });
        logger.info(`${type} 지급 알림 전송 성공: 상조팀장 ${targetId}`);
      } catch (notificationError) {
        logger.error(`${type} 지급 알림 전송 실패: 상조팀장 ${targetId}`, notificationError);
        // 알림 전송 실패해도 지급 자체는 성공으로 처리
      }

      return history;
    } else if (targetType === 'funeral') {
      const target = await db.Funeral.findByPk(targetId, { transaction });
      if (!target) throw new Error('장례식장을 찾을 수 없습니다.');

      const field = type === 'point' ? 'funeralPoint' : 'funeralCash';
      const balance = target[field] + amount;

      await db.Funeral.update(
        { [field]: balance },
        { where: { funeralId: targetId }, transaction },
      );

      const dao = type === 'point' ? funeralPointDao : funeralCashDao;
      const data = {
        funeralId: targetId,
        transactionType: type === 'point' ? 'earn_point' : 'earn_cash',
        [type === 'point' ? 'funeralPointAmount' : 'funeralCashAmount']: amount,
        [type === 'point' ? 'funeralPointBalanceAfter' : 'funeralCashBalanceAfter']: balance,
        status: 'completed',
      };

      const history = await dao.create(data, { transaction });
      await transaction.commit();

      // 장례식장에게 포인트/캐시 지급 알림 전송
      try {
        // 관리자 정보 조회
        const adminUserDao = await import('../../daos/admin/adminUserDao.js');
        const adminUser = await adminUserDao.findById();
        const adminId = adminUser ? adminUser.adminId : 'admin';

        await fcmService.sendNotificationToUser({
          receiverId: targetId,
          receiverType: 'funeral',
          notificationType: type === 'point' ? 'point_granted' : 'cash_granted',
          data: {
            amount: amount,
            balance: balance,
            type: type,
          },
          senderId: adminId,
          senderType: 'admin',
        });
        logger.info(`${type} 지급 알림 전송 성공: 장례식장 ${targetId}`);
      } catch (notificationError) {
        logger.error(`${type} 지급 알림 전송 실패: 장례식장 ${targetId}`, notificationError);
        // 알림 전송 실패해도 지급 자체는 성공으로 처리
      }

      return history;
    }

    throw new Error('타입이 올바르지 않습니다.');
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
