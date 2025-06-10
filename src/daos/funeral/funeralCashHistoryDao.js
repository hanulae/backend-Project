import db from '../../models/index.js';

export const create = async (cashData, options = {}) => {
  try {
    const result = await db.FuneralCashHistory.create(cashData, options);
    return result;
  } catch (error) {
    throw new Error('⚠️ 캐시 히스토리 생성 오류:' + error.message);
  }
};

export const createFuneralCashHistory = async (cashHistoryData, transactionType, options = {}) => {
  try {
    return await db.FuneralCashHistory.create(
      {
        ...cashHistoryData,
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

/**
 * 캐시 히스토리 상태 업데이트
 * @param {*} whereCondition
 * @param {*} status
 * @param {*} options
 * @returns
 */
export const updateFuneralCashHistoryStatus = async (whereCondition, status, options = {}) => {
  const result = await db.FuneralCashHistory.update(
    { status },
    {
      where: whereCondition,
      ...options,
    },
  );

  return result;
};
