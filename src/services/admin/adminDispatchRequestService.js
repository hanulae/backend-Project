// src/services/admin/adminDispatchRequestService.js
import * as adminDispatchRequestDao from '../../daos/admin/adminDispatchRequestDao.js';

export const getDispatchRequestsByAdminId = async (adminId) => {
  try {
    return await adminDispatchRequestDao.findDispatchRequestsByAdminId(adminId);
  } catch (error) {
    console.error('Error in service layer:', error);
    throw error;
  }
};

export const getDispatchRequestsByManagerId = async (managerId) => {
  try {
    return await adminDispatchRequestDao.findDispatchRequestsByManagerId(managerId);
  } catch (error) {
    console.error('상조팀장 출동 요청 조회 오류:', error.message);
    throw new Error('상조팀장 출동 요청 조회 실패: ' + error.message);
  }
};

export const getDispatchRequestsByFuneralId = async (funeralId) => {
  try {
    return await adminDispatchRequestDao.findDispatchRequestsByFuneralId(funeralId);
  } catch (error) {
    console.error('장례식장 출동 요청 조회 오류:', error.message);
    throw new Error('장례식장 출동 요청 조회 실패: ' + error.message);
  }
};
