// dao/manager/managerCashHistoryDao.js
import ManagerCashHistory from '../../models/manager/managerCashHistory.js'; // 모델 경로를 확인하세요

export const create = async (cashData, options = {}) => {
  try {
    const result = await ManagerCashHistory.create(cashData, options); // 트랜잭션 포함
    return result;
  } catch (error) {
    console.error('캐시 히스토리 생성 오류:', error.message);
    throw error;
  }
};
