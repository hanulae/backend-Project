import db from '../../models/index.js';
import * as managerPointDao from '../../daos/manager/managerPointHistoryDao.js';
import * as managerCashDao from '../../daos/manager/managerCashHistoryDao.js';
import * as funeralPointDao from '../../daos/funeral/funeralPointHistoryDao.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashHistoryDao.js';
import logger from '../../config/logger.js';
import fcmService from '../common/fcmService.js';

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
        await fcmService.sendNotificationToUser({
          receiverId: targetId,
          receiverType: 'manager',
          notificationType: type === 'point' ? 'point_granted' : 'cash_granted',
          data: {
            amount: amount,
            balance: balance,
            type: type,
          },
          senderId: 'admin',
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
        await fcmService.sendNotificationToUser({
          receiverId: targetId,
          receiverType: 'funeral',
          notificationType: type === 'point' ? 'point_granted' : 'cash_granted',
          data: {
            amount: amount,
            balance: balance,
            type: type,
          },
          senderId: 'admin',
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
