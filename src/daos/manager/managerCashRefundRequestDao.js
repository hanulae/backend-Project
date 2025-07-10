import db from '../../models/index.js';

export const create = async ({ managerId, amount, status = 'requested' }) => {
  try {
    return await db.ManagerCashRefundRequest.create({
      managerId,
      refundAmount: amount, // 필드명 일치
      status,
      // adminMemo: ... // 필요시
    });
  } catch (error) {
    throw new Error('환급 요청 저장 실패: ' + error.message);
  }
};
