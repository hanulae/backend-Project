import db from '../../models/index.js';
import ManagerCashHistory from '../../models/manager/managerCashHistory.js';
import FuneralCashHistory from '../../models/funeral/funeralCashHistory.js'; // Assuming this model exists

export const findAllFuneralCashChargeHistory = async () => {
  try {
    return await db.FuneralCashHistory.findAll({
      where: { transactionType: 'earn_cash' }, // 충전 내역만
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Funeral,
          as: 'funeral',
          attributes: ['funeralName', 'funeralId'],
        },
      ],
    });
  } catch (error) {
    throw new Error('전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

export const findAllManagerCashChargeHistory = async () => {
  try {
    return await db.ManagerCashHistory.findAll({
      where: { transactionType: 'charge_cash' }, // 충전 내역만
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Manager,
          as: 'manager',
          attributes: ['managerUsername', 'managerId'],
        },
      ],
    });
  } catch (error) {
    throw new Error('상조팀장 전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

export const findFuneralCashChargeHistoryById = async (funeralId) => {
  try {
    return await db.FuneralCashHistory.findAll({
      where: {
        transactionType: 'earn_cash', // 충전 내역만
        funeralId: funeralId, // Use the funeralId to filter
      },
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Funeral,
          as: 'funeral',
          attributes: ['funeralName', 'funeralId'],
        },
      ],
    });
  } catch (error) {
    throw new Error('전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

export const findManagerCashChargeHistoryById = async (managerId) => {
  try {
    return await db.ManagerCashHistory.findAll({
      where: {
        transactionType: 'charge_cash', // 충전 내역만
        managerId: managerId, // Use the managerId to filter
      },
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Manager,
          as: 'manager',
          attributes: ['managerUsername', 'managerId'],
        },
      ],
    });
  } catch (error) {
    throw new Error('상조팀장 전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

export const addCashToManager = async (managerId, amount, transaction) => {
  try {
    const manager = await db.Manager.findByPk(managerId, { transaction });
    if (!manager) {
      throw new Error('상조팀장을 찾을 수 없습니다.');
    }
    manager.managerCash += amount;
    await manager.save({ transaction });
    return manager;
  } catch (error) {
    console.error('상조팀장 캐시 추가 오류:', error.message);
    throw new Error('상조팀장 캐시 추가에 실패했습니다.');
  }
};

export const addCashToFuneral = async (funeralId, amount, transaction) => {
  try {
    const funeral = await db.Funeral.findByPk(funeralId, { transaction });
    if (!funeral) {
      throw new Error('장례식장을 찾을 수 없습니다.');
    }
    funeral.funeralCash += amount;
    await funeral.save({ transaction });
    return funeral;
  } catch (error) {
    console.error('장례식장 캐시 추가 오류:', error.message);
    throw new Error('장례식장 캐시 추가에 실패했습니다.');
  }
};

export const recordManagerCashHistory = async (managerId, amount, transactionType, transaction) => {
  try {
    const manager = await db.Manager.findByPk(managerId, { transaction });
    if (!manager) {
      throw new Error('상조팀장을 찾을 수 없습니다.');
    }
    await ManagerCashHistory.create(
      {
        managerId,
        transactionType,
        managerCashAmount: amount,
        managerCashBalanceAfter: manager.managerCash,
        transactionDate: new Date(),
        status: 'completed',
      },
      { transaction },
    );
  } catch (error) {
    console.error('상조팀장 캐시 히스토리 기록 오류:', error.message);
    throw new Error('상조팀장 캐시 히스토리 기록에 실패했습니다.');
  }
};

export const recordFuneralCashHistory = async (funeralId, amount, transactionType, transaction) => {
  try {
    const funeral = await db.Funeral.findByPk(funeralId, { transaction });
    console.log('🚀 ~ recordFuneralCashHistory ~ funeral:', funeral);
    if (!funeral) {
      throw new Error('장례식장을 찾을 수 없습니다.');
    }
    await FuneralCashHistory.create(
      {
        funeralId,
        transactionType,
        funeralCashAmount: amount,
        funeralCashBalanceAfter: funeral.funeralCash,
        transactionDate: new Date(),
        status: 'completed',
      },
      { transaction },
    );
  } catch (error) {
    console.error('장례식장 캐시 히스토리 기록 오류:', error.message);
    throw new Error('장례식장 캐시 히스토리 기록에 실패했습니다.');
  }
};

export const findAllCashChargeHistory = async () => {
  try {
    // 상조팀장 캐시 충전 내역
    const managerCash = await db.ManagerCashHistory.findAll({
      where: { transactionType: 'charge_cash' },
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Manager,
          as: 'manager',
          attributes: ['managerUsername', 'managerId'],
        },
      ],
    });

    // 장례식장 캐시 충전 내역
    const funeralCash = await db.FuneralCashHistory.findAll({
      where: { transactionType: 'earn_cash' }, // 충전 내역만
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: db.Funeral,
          as: 'funeral',
          attributes: ['funeralName', 'funeralId'],
        },
      ],
    });

    return { managerCash, funeralCash };
  } catch (error) {
    throw new Error('전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};
