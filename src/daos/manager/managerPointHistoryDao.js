// dao/manager/managerPointHistoryDao.js
import ManagerPointHistory from '../../models/manager/managerPointHistory.js'; // 모델 경로를 확인하세요

export const create = async (pointData) => {
  try {
    const result = await ManagerPointHistory.create(pointData);
    return result;
  } catch (error) {
    console.error('포인트 히스토리 생성 오류:', error.message);
    throw error;
  }
};
