import db from '../../models/index.js';

export const findManagerById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    throw new Error('매니저 조회 오류:' + error.message);
  }
};

/**
 * 상조팀장의 캐시 업데이트 (완전 교체)
 * @param {*} managerId
 * @param {*} newBalance
 * @param {*} options
 */
export const updateManagerCash = async (managerId, newBalance, options = {}) => {
  try {
    return await db.Manager.update(
      { managerCash: newBalance },
      { where: { managerId: managerId }, ...options },
    );
  } catch (error) {
    throw new Error('캐시 업데이트 오류:' + error.message);
  }
};

/**
 * 상조팀장의 캐시 추가 (현재 잔액에 추가)
 * @param {*} managerId
 * @param {*} amount - 추가할 금액
 * @param {*} options
 * @returns {*} 업데이트된 최종 잔액
 */
export const addManagerCash = async (managerId, amount, options = {}) => {
  try {
    // 현재 잔액 조회
    const currentCash = await getCurrentCash(managerId);

    // 새로운 잔액 계산
    const newBalance = currentCash + amount;

    // 업데이트 실행
    await db.Manager.update(
      { managerCash: newBalance },
      { where: { managerId: managerId }, ...options },
    );

    return newBalance;
  } catch (error) {
    throw new Error('캐시 추가 오류:' + error.message);
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

export const getCurrentCash = async (managerId) => {
  const manager = await db.Manager.findByPk(managerId, {
    attributes: ['managerCash'],
  });

  if (!manager) {
    throw new Error('상조팀장을 찾을 수 없습니다.');
  }

  return manager.managerCash;
};

// 캐시 거절 히스토리 상태 업데이트
export const updateCashHistoryStatusReject = async (
  managerId,
  transactionType,
  oldStatus,
  newStatus,
  options = {},
  newBalance = null,
) => {
  try {
    console.log('🚀 ~ updateCashHistoryStatus ~ newBalance:', newBalance);
    return await db.ManagerCashHistory.update(
      { status: newStatus, managerCashBalanceAfter: newBalance },
      {
        where: {
          managerId,
          transactionType,
          status: oldStatus,
        },
        ...options,
      },
    );
  } catch (error) {
    throw new Error('캐시 히스토리 상태 업데이트 오류:' + error.message);
  }
};

// 캐시 승인 히스토리 상태 업데이트
export const updateCashHistoryStatusApprove = async (
  managerId,
  transactionType,
  oldStatus,
  newStatus,
  options = {},
) => {
  try {
    return await db.ManagerCashHistory.update(
      { status: newStatus },
      {
        where: {
          managerId,
          transactionType,
          status: oldStatus,
        },
        ...options,
      },
    );
  } catch (error) {
    throw new Error('캐시 히스토리 상태 업데이트 오류:' + error.message);
  }
};
