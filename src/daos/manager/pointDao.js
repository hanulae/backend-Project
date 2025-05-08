import db from '../../models/index.js';
const { ManagerPointHistory } = db;

export const insertPointToCash = async (managerId, amount) => {
  return await ManagerPointHistory.create({
    managerId,
    transactionType: 'cash_the_point',
    managerPointAmount: amount,
    managerPointBalanceAfter: 0, // 실제 계산 필요
    status: 'pending',
  });
};

export const fetchPointHistory = async (managerId, offset, limit) => {
  return await ManagerPointHistory.findAndCountAll({
    where: { managerId },
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
};
