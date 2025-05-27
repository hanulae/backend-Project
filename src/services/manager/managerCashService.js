import * as managerCashDao from '../../daos/manager/managerCashDao.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';

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

export const requestCashRefund = async ({ managerId, amountCash }) => {
  try {
    if (!amountCash || amountCash <= 0) throw new Error('환급 요청 금액이 올바르지 않습니다.');

    // 상조팀장 정보 조회
    const manager = await managerUserDao.findById(managerId);
    if (!manager) throw new Error('상조팀장 정보를 찾을 수 없습니다.');

    // 보유 캐시보다 많은 금액 요청 시 에러
    if (manager.managerCash < amountCash) {
      throw new Error(
        `환급 요청 금액이 보유 캐시보다 많습니다. 현재 보유 캐시: ${manager.managerCash}원`,
      );
    }

    // 환급 요청 기록 (pending 상태)
    const refundRequest = await managerCashDao.create({
      managerId,
      transactionType: 'withdraw_cash',
      managerCashAmount: amountCash,
      managerCashBalanceAfter: manager.managerCash - amountCash,
      status: 'pending',
    });

    return refundRequest;
  } catch (error) {
    throw new Error('환급 요청 실패: ' + error.message);
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
