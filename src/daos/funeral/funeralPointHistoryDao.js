import db from '../../models/index.js';

export const create = async (pointData, options = {}) => {
  try {
    const result = await db.FuneralPointHistory.create(pointData, options);
    return result;
  } catch (error) {
    console.error('⚠️ 포인트 히스토리 생성 오류:', error.message);
    throw error;
  }
};
