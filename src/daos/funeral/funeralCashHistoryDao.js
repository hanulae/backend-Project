import db from '../../models/index.js';

export const create = async (cashData, options = {}) => {
  try {
    const result = await db.FuneralCashHistory.create(cashData, options);
    return result;
  } catch (error) {
    console.error('⚠️ 캐시 히스토리 생성 오류:', error.message);
    throw error;
  }
};
