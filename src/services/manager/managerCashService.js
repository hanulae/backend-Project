import * as managerCashDao from '../../daos/manager/managerCashDao.js';

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

export const withdrawCash = async ({ managerId, amount, bankTransactionId }) => {
  try {
    const manager = await managerCashDao.findManagerById(managerId);
    if (!manager) throw new Error('존재하지 않는 사용자입니다.');

    if (manager.managerCash < amount) throw new Error('잔액이 부족합니다.');

    const newBalance = manager.managerCash - amount;

    await managerCashDao.updateManagerCash(managerId, newBalance);
    const history = await managerCashDao.createCashHistory({
      managerId,
      transactionType: 'withdraw_cash',
      managerCashAmount: amount,
      managerCashBalanceAfter: newBalance,
      bankTransactionId,
      status: 'completed',
    });

    return history;
  } catch (error) {
    console.error('캐시 환급 오류:', error.message);
    throw error;
  }
};

export const getCashHistory = async (managerId) => {
  try {
    return await managerCashDao.findCashHistoryByManagerId(managerId);
  } catch (error) {
    console.error('캐시 내역 조회 오류:', error.message);
    throw error;
  }
};
