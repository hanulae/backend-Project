import db from '../../models/index.js';

export const findManagerById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    console.error('매니저 조회 오류:', error.message);
    throw error;
  }
};

export const updateManagerCash = async (managerId, newBalance) => {
  try {
    return await db.Manager.update({ managerCash: newBalance }, { where: { managerId } });
  } catch (error) {
    console.error('캐시 업데이트 오류:', error.message);
    throw error;
  }
};

export const createCashHistory = async ({
  managerId,
  transactionType,
  managerCashAmount,
  managerCashBalanceAfter,
  funeralListId = null,
  managerFormBidId = null,
  bankTransactionId = null,
  status = 'pending',
}) => {
  try {
    return await db.ManagerCashHistory.create({
      managerId,
      transactionType,
      managerCashAmount,
      managerCashBalanceAfter,
      funeralListId,
      managerFormBidId,
      transactionDate: new Date(),
      bankTransactionId,
      status,
    });
  } catch (error) {
    console.error('캐시 내역 생성 오류:', error.message);
    throw error;
  }
};

export const findCashHistoryByManagerId = async (managerId) => {
  try {
    return await db.ManagerCashHistory.findAll({
      where: { managerId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    console.error('캐시 내역 조회 오류:', error.message);
    throw error;
  }
};
