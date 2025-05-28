// dao/manager/managerCashHistoryDao.js
import ManagerCashHistory from '../../models/manager/managerCashHistory.js'; // 모델 경로를 확인하세요
import Manager from '../../models/manager/manager.js';
import db from '../../models/index.js';

export const create = async (cashData, options = {}) => {
  try {
    const result = await db.ManagerCashHistory.create(cashData, options); // 트랜잭션 포함
    return result;
  } catch (error) {
    console.error('캐시 히스토리 생성 오류:', error.message);
    throw error;
  }
};

export const createManagerCashHistory = async (cashHistoryData, transactionType, options = {}) => {
  try {
    //1. 현재 상조팀장의 캐시 잔액 조회
    const manager = await Manager.findByPk(cashHistoryData.managerId);
    if (!manager) {
      throw new Error('상조팀장을 찾을 수 없습니다.');
    }
    // 2. 새로운 잔액 계산 (현재 잔액 + 추가되는 금액)
    const currentBalance = manager.managerCash || 0;
    const balanceAfter = currentBalance + cashHistoryData.managerCashAmount;

    // 3. 히스토리 생성
    return await ManagerCashHistory.create(
      {
        ...cashHistoryData,
        managerCashBalanceAfter: balanceAfter,
        transactionType,
        status: cashHistoryData.status || 'pending',
      },
      { ...options },
    );
  } catch (error) {
    console.error('캐시 히스토리 생성 오류:', error.message);
    throw error;
  }
};
