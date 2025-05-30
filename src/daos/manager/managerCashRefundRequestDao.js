import db from '../../models/index.js';

export const create = async ({ managerId, amount, status = 'pending' }) => {
  try {
    return await db.ManagerCashRefundRequest.create({
      managerId,
      amount,
      status,
      requestedAt: new Date(),
    });
  } catch (error) {
    throw new Error('환급 요청 저장 실패: ' + error.message);
  }
};
