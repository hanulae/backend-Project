import * as adminCashDao from '../../daos/admin/adminCashDao.js';

export const getAllFuneralCashChargeHistory = async () => {
  try {
    return await adminCashDao.findAllFuneralCashChargeHistory();
  } catch (error) {
    throw new Error('전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};

export const getAllManagerCashChargeHistory = async () => {
  try {
    return await adminCashDao.findAllManagerCashChargeHistory();
  } catch (error) {
    throw new Error('상조팀장 전체 캐시 충전 내역 조회 실패: ' + error.message);
  }
};
