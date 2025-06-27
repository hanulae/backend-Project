import * as funeralPointDao from '../../daos/funeral/funeralPointDao.js';

export const convertPointToCash = async ({ funeralId, amount }) => {
  try {
    if (!amount || amount < 100000) {
      throw new Error('10만 포인트 이상부터 환급이 가능합니다.');
    }

    const funeral = await funeralPointDao.findFuneralById(funeralId);
    if (!funeral) throw new Error('장례식장 정보를 찾을 수 없습니다.');

    if (funeral.funeralPoint < amount) {
      throw new Error(`보유 포인트가 부족합니다. 현재 보유 포인트: ${funeral.funeralPoint}원`);
    }

    const newPoint = funeral.funeralPoint - amount;
    const newCash = funeral.funeralCash + amount;

    // 포인트 차감 및 캐시 증가
    await funeralPointDao.updatePointAndCash(funeralId, newPoint, newCash);

    // 환급 이력 기록
    const result = await funeralPointDao.createPointToCashRequest({
      funeralId,
      funeralPointAmount: amount,
      funeralPointBalanceAfter: newPoint,
      funeralCashAmount: amount,
      funeralCashBalanceAfter: newCash,
    });

    return result;
  } catch (error) {
    throw new Error('🔴 포인트 환급 오류:', error.message);
  }
};

export const getCurrentPoint = async (funeralId) => {
  return await funeralPointDao.getCurrentPoint(funeralId);
};
