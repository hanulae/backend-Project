import db from '../../models/index.js';

// 장례식장 단건 조회
export const findFuneralById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId);
  } catch (error) {
    throw new Error('장례식장 조회 오류: ' + error.message);
  }
};

// 장례식장 캐시 업데이트
export const updateFuneralCash = async (funeralId, newBalance) => {
  try {
    return await db.Funeral.update({ funeralCash: newBalance }, { where: { funeralId } });
  } catch (error) {
    throw new Error('장례식장 캐시 업데이트 오류: ' + error.message);
  }
};

// 장례식장 캐시 히스토리 생성
export const createCashHistory = async ({
  funeralId,
  transactionType,
  funeralCashAmount,
  funeralCashBalanceAfter,
  funeralListId = null,
  managerFormBidId = null,
  bankTransactionId = null,
  status = 'pending',
}) => {
  try {
    return await db.FuneralCashHistory.create({
      funeralId,
      transactionType,
      funeralCashAmount,
      funeralCashBalanceAfter,
      funeralListId,
      managerFormBidId,
      transactionDate: new Date(),
      bankTransactionId,
      status,
    });
  } catch (error) {
    throw new Error('장례식장 캐시 히스토리 생성 오류: ' + error.message);
  }
};

// 장례식장 캐시 히스토리 조회
export const findCashHistoryByFuneralId = async (funeralId) => {
  try {
    return await db.FuneralCashHistory.findAll({
      where: { funeralId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('장례식장 캐시 내역 조회 오류: ' + error.message);
  }
};

// 환급 요청 생성 (기본값 상태는 pending)
export const create = async (data) => {
  try {
    return await db.FuneralCashHistory.create(data);
  } catch (error) {
    throw new Error('🔴 장례식장 환급 요청 DAO 오류: ' + error.message);
  }
};

export const getCurrentCash = async (funeralId) => {
  const funeral = await db.Funeral.findByPk(funeralId, {
    attributes: ['funeralCash'],
  });

  if (!funeral) {
    throw new Error('장례식장을 찾을 수 없습니다.');
  }

  return funeral.funeralCash;
};
