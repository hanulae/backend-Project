import db from '../../models/index.js';

export const createInitialCash = async (funeralId) => {
  try {
    return await db.FuneralCashHistory.create({
      funeralId,
      transactionType: 'service_cash',
      funeralCashAmount: 0,
      funeralCashBalanceAfter: 0,
      status: 'completed',
    });
  } catch (error) {
    console.error('캐시 초기화 오류:', error.message);
    throw error;
  }
};
