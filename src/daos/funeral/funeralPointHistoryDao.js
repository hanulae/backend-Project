import db from '../../models/index.js';

export const create = async (pointData, options = {}) => {
  try {
    const result = await db.FuneralPointHistory.create(pointData, options);
    return result;
  } catch (error) {
    throw new Error('⚠️ 포인트 히스토리 생성 오류:' + error.message);
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

/**
 * 포인트 히스토리 상태 업데이트
 * @param {*} whereCondition
 * @param {*} status
 * @param {*} options
 * @returns
 */
export const updateFuneralPointHistoryStatus = async (whereCondition, status, options = {}) => {
  const result = await db.FuneralPointHistory.update(
    { status },
    {
      where: whereCondition,
      ...options,
    },
  );

  return result;
};
