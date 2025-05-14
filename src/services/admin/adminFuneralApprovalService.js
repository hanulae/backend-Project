import * as funeralApprovalDao from '../../daos/admin/adminFuneralApprovalDao.js';

export const getGroupedFuneralList = async () => {
  const approved = await funeralApprovalDao.findByApprovalStatus(true);
  const requests = await funeralApprovalDao.findByApprovalStatus(false);
  return { approved, requests };
};

export const getPendingFunerals = async () => {
  return await funeralApprovalDao.findAllPending();
};

export const setApprovalStatus = async (funeralId, isApproved) => {
  return await funeralApprovalDao.updateApproval(funeralId, isApproved);
};
