import db from '../../models/index.js';

export const createInitialPoint = async (funeralId) => {
  try {
    return await db.FuneralPointHistory.create({
      funeralId,
      transactionType: 'service_point',
      funeralPointAmount: 0,
      funeralPointBalanceAfter: 0,
      status: 'completed',
    });
  } catch (error) {
    console.error('포인트 초기화 오류:', error.message);
    throw error;
  }
};

export const createFuneralPointHistory = async (
  pointHistoryData,
  transactionType,
  options = {},
) => {
  try {
    return await db.FuneralPointHistory.create(
      {
        ...pointHistoryData,
        transactionType,
        status: pointHistoryData.status || 'pending',
      },
      { ...options },
    );
  } catch (error) {
    console.error('포인트 히스토리 생성 오류:', error.message);
    throw error;
  }
};
