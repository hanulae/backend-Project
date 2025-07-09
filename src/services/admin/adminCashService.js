import * as adminCashDao from '../../daos/admin/adminCashDao.js';
import db from '../../models/index.js'; // Assuming db is the Sequelize instance

//상조팀장 캐시 충전 내역 조회
export const getAllManagerCashChargeHistory = async () => {
  try {
    return await adminCashDao.findAllManagerCashChargeHistory();
  } catch (error) {
    throw new Error('상조팀장 전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

// 전체 유저 캐시 충전 내역 조회
export const getAllUserCashChargeHistory = async (type) => {
  try {
    const managerCashCharges = await adminCashDao.findAllManagerCashChargeHistory();
    const funeralCashCharges = await adminCashDao.findAllFuneralCashChargeHistory();

    if (type === 'manager') {
      return { managers: managerCashCharges };
    } else if (type === 'funeral') {
      return { funerals: funeralCashCharges };
    } else {
      return {
        managers: managerCashCharges,
        funerals: funeralCashCharges,
      };
    }
  } catch (error) {
    throw new Error('전체 유저 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

// 특정 장례식장 캐시 충전 내역 조회
export const getFuneralCashChargeHistoryById = async (funeralId) => {
  try {
    return await adminCashDao.findFuneralCashChargeHistoryById(funeralId);
  } catch (error) {
    throw new Error('장례식장 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

// 특정 상조팀장 캐시 충전 내역 조회
export const getManagerCashChargeHistoryById = async (managerId) => {
  try {
    return await adminCashDao.findManagerCashChargeHistoryById(managerId);
  } catch (error) {
    throw new Error('상조팀장 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

export const giveCashToUser = async (userId, amount, userType) => {
  const transaction = await db.sequelize.transaction();
  try {
    let result;
    if (userType === 'manager') {
      result = await adminCashDao.addCashToManager(userId, amount, transaction);
      await adminCashDao.recordManagerCashHistory(userId, amount, 'charge_cash', transaction);
    } else if (userType === 'funeral') {
      result = await adminCashDao.addCashToFuneral(userId, amount, transaction);
      await adminCashDao.recordFuneralCashHistory(userId, amount, 'charge_cash', transaction);
    } else {
      throw new Error('유효하지 않은 사용자 타입입니다.');
    }
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    console.error('캐시 지급 오류:', error.message);
    throw new Error('캐시 지급에 실패했습니다.');
  }
};
