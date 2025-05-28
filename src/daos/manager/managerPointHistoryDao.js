// dao/manager/managerPointHistoryDao.js
import db from '../../models/index.js'; // 모델 경로를 확인하세요

export const create = async (pointData, options = {}) => {
  try {
    const result = await db.ManagerPointHistory.create(pointData, options); // 트랜잭션 포함
    return result;
  } catch (error) {
    console.error('포인트 히스토리 생성 오류:', error.message);
    throw error;
  }
};
