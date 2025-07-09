import * as funeralApprovalDao from '../../daos/admin/adminFuneralApprovalDao.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';
import coolsms from 'coolsms-node-sdk';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

export const getGroupedFuneralList = async () => {
  const approved = await funeralApprovalDao.findByApprovalStatus(true);
  const requests = await funeralApprovalDao.findByApprovalStatus(false);
  return { approved, requests };
};

export const getPendingFunerals = async () => {
  return await funeralApprovalDao.findAllPending();
};

export const getFuneralDocument = async (funeralId) => {
  return await funeralApprovalDao.findByFuneralId(funeralId);
};

export const setApprovalStatus = async (funeralId, isApproved) => {
  return await funeralApprovalDao.updateApproval(funeralId, isApproved);
};

export const sendRejectionSMS = async (phoneNumber, message) => {
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

export const getFuneralById = async (funeralId) => {
  try {
    const funeral = await funeralUserDao.findById(funeralId);
    if (!funeral) {
      throw new Error('장례식장을 찾을 수 없습니다');
    }
    return funeral;
  } catch (error) {
    console.error('ID로 장례식장 정보 가져오기 오류:', error.message);
    throw new Error('장례식장 정보를 가져오는 데 실패했습니다');
  }
};
