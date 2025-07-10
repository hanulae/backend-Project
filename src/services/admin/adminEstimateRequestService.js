import * as estimateRequestDao from '../../daos/admin/estimateRequestDao.js';

export const getEstimateRequestsByUserId = async (userId, userType) => {
  try {
    if (userType === 'manager') {
      return await estimateRequestDao.findEstimateRequestsByManagerId(userId);
    } else if (userType === 'funeral') {
      return await estimateRequestDao.findEstimateRequestsByFuneralId(userId);
    }
    throw new Error('유효하지 않은 userType입니다. (manager 또는 funeral)');
  } catch (error) {
    console.error('특정 회원별 견적 신청 내역 조회 오류:', error.message);
    throw new Error('견적 신청 내역 조회 실패: ' + error.message);
  }
};
