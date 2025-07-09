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
