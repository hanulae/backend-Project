import db from '../../models/index.js';

export const findManagerById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    throw new Error('매니저 조회 오류:' + error.message);
  }
};

export const updateManagerCash = async (managerId, newBalance) => {
  try {
    return await db.Manager.update({ managerCash: newBalance }, { where: { managerId } });
  } catch (error) {
    throw new Error('캐시 업데이트 오류:' + error.message);
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
    throw new Error('캐시 내역 생성 오류:' + error.message);
  }
};

export const findCashHistoryByManagerId = async (managerId) => {
  try {
    return await db.ManagerCashHistory.findAll({
      where: { managerId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('캐시 내역 조회 오류:' + error.message);
  }
};

export const create = async (data) => {
  try {
    return await db.ManagerCashHistory.create(data);
  } catch (error) {
    throw new Error('🔴 환급 요청 DAO 오류:' + error.message);
  }
};
