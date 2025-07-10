import db from '../../models/index.js';

export const findEstimateRequestsByManagerId = async (managerId) => {
  try {
    return await db.EstimateRequest.findAll({
      where: { managerId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('상조팀장 견적 신청 내역 조회 오류: ' + error.message);
  }
};

export const findEstimateRequestsByFuneralId = async (funeralId) => {
  try {
    return await db.EstimateRequest.findAll({
      where: { funeralId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 견적 신청 내역 조회 오류: ' + error.message);
  }
};
