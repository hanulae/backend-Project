import db from '../../models/index.js';
import * as managerPointDao from '../../daos/manager/managerPointHistoryDao.js';
import * as managerCashDao from '../../daos/manager/managerCashHistoryDao.js';
import * as funeralPointDao from '../../daos/funeral/funeralPointHistoryDao.js';
import * as funeralCashDao from '../../daos/funeral/funeralCashHistoryDao.js';

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
      return history;
    }

    throw new Error('타입이 올바르지 않습니다.');
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
