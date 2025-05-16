import db from '../../models/index.js';
const { ManagerCashHistory } = db;

export const insertCashWithdraw = async (managerId, amount) => {
  return await ManagerCashHistory.create({
    managerId,
    transactionType: 'withdraw_cash',
    managerCashAmount: amount,
    managerCashBalanceAfter: 0, // 실제 계산 필요
    status: 'pending',
  });
};

export const fetchCashHistory = async (managerId, offset, limit) => {
  return await ManagerCashHistory.findAndCountAll({
    where: { managerId },
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
};
