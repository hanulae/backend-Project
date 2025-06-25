import db from '../../models/index.js';

export const insertPointToCash = async (managerId, amount) => {
  // 현재 포인트 잔액 조회
  const latestPoint = await db.ManagerPointHistory.findOne({
    where: { managerId },
    order: [['createdAt', 'DESC']],
  });

  const currentPointBalance = latestPoint ? latestPoint.managerPointBalanceAfter : 0;

  // ✅ 환급 요청 금액이 현재 포인트 초과 시 예외 처리
  if (amount > currentPointBalance) {
    throw new Error('환급 금액이 보유 포인트를 초과했습니다.');
  }

  const newPointBalance = currentPointBalance - amount;

  // 포인트 내역 기록
  await db.ManagerPointHistory.create({
    managerId,
    transactionType: 'cash_the_point',
    managerPointAmount: amount,
    managerPointBalanceAfter: newPointBalance,
    status: 'pending',
  });

  // 현재 캐쉬 잔액 조회
  const latestCash = await db.ManagerCashHistory.findOne({
    where: { managerId },
    order: [['createdAt', 'DESC']],
  });

  const currentCashBalance = latestCash ? latestCash.managerCashBalanceAfter : 0;
  const newCashBalance = currentCashBalance + amount;

  // 캐쉬 내역 기록
  await db.ManagerCashHistory.create({
    managerId,
    transactionType: 'earn_cash',
    managerCashAmount: amount,
    managerCashBalanceAfter: newCashBalance,
    status: 'completed',
  });

  // 포인트/캐쉬 필드 업데이트
  await db.Manager.update(
    {
      managerPoint: newPointBalance,
      managerCash: newCashBalance,
    },
    {
      where: { managerId },
    },
  );

  return { managerPoint: newPointBalance, managerCash: newCashBalance };
};

export const fetchPointHistory = async (managerId, offset, limit) => {
  return await db.ManagerPointHistory.findAndCountAll({
    where: { managerId },
    offset,
    limit,
    order: [['createdAt', 'DESC']],
  });
};

export const getCurrentPoint = async (managerId) => {
  const manager = await db.Manager.findByPk(managerId, {
    attributes: ['managerPoint'],
  });

  if (!manager) {
    throw new Error('상조팀장을 찾을 수 없습니다.');
  }

  return manager.managerPoint;
};
