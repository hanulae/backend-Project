import * as managerApprovalDao from '../../daos/admin/adminManagerApprovalDao.js';

export const getGroupedManagerList = async () => {
  const approved = await managerApprovalDao.findByApprovalStatus(true);
  const requests = await managerApprovalDao.findByApprovalStatus(false);
  return {
    approved,
    requests,
  };
};

export const getPendingManagers = async () => {
  return await managerApprovalDao.findAllPending();
};

export const setApprovalStatus = async (managerId, isApproved) => {
  return await managerApprovalDao.updateApproval(managerId, isApproved);
};
