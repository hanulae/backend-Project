import db from '../../models/index.js';

// 포인트 → 캐시 환급 요청 기록
export const createPointToCashRequest = async ({
  funeralId,
  funeralPointAmount,
  funeralPointBalanceAfter,
  funeralCashAmount,
  funeralCashBalanceAfter,
}) => {
  try {
    return await db.FuneralPointHistory.create({
      funeralId,
      transactionType: 'point_to_cash',
      funeralPointAmount,
      funeralPointBalanceAfter,
      funeralCashAmount,
      funeralCashBalanceAfter,
      status: 'completed',
      transactionDate: new Date(),
    });
  } catch (error) {
    throw new Error('🔴 포인트 환급 기록 실패: ' + error.message);
  }
};

export const findFuneralById = async (funeralId) => {
  return await db.Funeral.findByPk(funeralId);
};

export const updatePointAndCash = async (funeralId, newPoint, newCash) => {
  return await db.Funeral.update(
    { funeralPoint: newPoint, funeralCash: newCash },
    { where: { funeralId } },
  );
};

export const getCurrentPoint = async (funeralId) => {
  const funeral = await db.Funeral.findByPk(funeralId, {
    attributes: ['funeralPoint'],
  });

  if (!funeral) {
    throw new Error('장례식장을 찾을 수 없습니다.');
  }

  return funeral.funeralPoint;
};
