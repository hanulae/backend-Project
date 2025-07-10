import * as managerApprovalDao from '../../daos/admin/adminManagerApprovalDao.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';
import coolsms from 'coolsms-node-sdk';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

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

export const getManagerDocument = async (managerId) => {
  return await managerApprovalDao.findManagerFile(managerId);
};

export const setApprovalStatus = async (managerId, isApproved) => {
  return await managerApprovalDao.updateApproval(managerId, isApproved);
};

export const sendRejectionSMS = async (phoneNumber, message) => {
  console.log('🚀 ~ sendRejectionSMS ~ phoneNumber, message:', phoneNumber, message);
  try {
    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: message,
    });
    console.log('거절 SMS 전송 성공');
  } catch (error) {
    console.error('거절 SMS 전송 실패:', error);
    throw new Error('거절 SMS 전송에 실패했습니다');
  }
};

export const getManagerById = async (managerId) => {
  try {
    const manager = await managerUserDao.findById(managerId);
    if (!manager) {
      throw new Error('상조팀장을 찾을 수 없습니다');
    }
    return manager;
  } catch (error) {
    console.error('ID로 상조팀장 정보 가져오기 오류:', error.message);
    throw new Error('상조팀장 정보를 가져오는 데 실패했습니다');
  }
};
