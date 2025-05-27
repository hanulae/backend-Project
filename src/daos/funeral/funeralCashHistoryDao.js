import db from '../../models/index.js';

export const create = async (cashData, options = {}) => {
  try {
    const result = await db.FuneralCashHistory.create(cashData, options);
    return result;
  } catch (error) {
    throw new Error('⚠️ 캐시 히스토리 생성 오류:' + error.message);
  }
};
