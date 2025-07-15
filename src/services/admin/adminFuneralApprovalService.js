import * as funeralApprovalDao from '../../daos/admin/adminFuneralApprovalDao.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';
import * as funeralAddDocumentDao from '../../daos/admin/funeralAddDocumentDao.js';
import coolsms from 'coolsms-node-sdk';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

export const getGroupedFuneralList = async () => {
  const approved = await funeralApprovalDao.findByApprovalStatus(true);

  // 각 funeral에 funeralAddDocument 배열을 비동기로 할당
  const approvedWithDocs = await Promise.all(
    approved.map(async (funeral) => {
      const funeralId = funeral.funeralId;
      // 여러 개의 문서를 배열로 가져온다고 가정
      const funeralAddDocuments = await funeralAddDocumentDao.findAllByFuneralId(funeralId);
      // toJSON()이 있다면 plain object로 변환
      return {
        ...(funeral.toJSON ? funeral.toJSON() : funeral),
        fileUrl: funeralAddDocuments.map((doc) => doc.funeralDocPath), // ✅
      };
    }),
  );

  const requests = await funeralApprovalDao.findByApprovalStatus(false);

  // 각 funeral에 funeralAddDocument 배열을 비동기로 할당
  const requestsWithDocs = await Promise.all(
    requests.map(async (funeral) => {
      const funeralId = funeral.funeralId;
      // 여러 개의 문서를 배열로 가져온다고 가정
      const funeralAddDocuments = await funeralAddDocumentDao.findAllByFuneralId(funeralId);
      // toJSON()이 있다면 plain object로 변환
      return {
        ...(funeral.toJSON ? funeral.toJSON() : funeral),
        fileUrl: funeralAddDocuments.map((doc) => doc.funeralDocPath), // ✅
      };
    }),
  );

  return { approved: approvedWithDocs, requests: requestsWithDocs };
};

export const getPendingFunerals = async () => {
  return await funeralApprovalDao.findAllPending();
};

export const getFuneralDocument = async (funeralId) => {
  return await funeralApprovalDao.findByFuneralId(funeralId);
};

export const setApprovalStatus = async (funeralId, isApproved) => {
  try {
    const funeral = await funeralApprovalDao.findByFuneralId(funeralId);
    console.log('🚀 ~ setApprovalStatus ~ funeral:', funeral);
    if (!funeral) return null;

    // 승인 처리
    if (isApproved) {
      // funeralHome 컬럼에 funeralListId가 들어있다고 가정
      const funeralListId = funeral.funeralHome;
      if (funeralListId) {
        // funeral_lists 테이블의 funeralId, FuneralTotalRooms 컬럼 업데이트
        await funeralApprovalDao.updateFuneralList(
          { funeralId, funeralTotalRooms: 0 }, // 카멜케이스!
          { funeralListId },
        );
      }
    }

    // funeral의 isApproved 필드 등 업데이트
    funeral.isApproved = isApproved;
    await funeral.save();

    return funeral;
  } catch (error) {
    console.log('🚀 ~ setApprovalStatus ~ error:', error);
    throw new Error('장례식장 승인/거절 처리 중 오류가 발생했습니다: ' + error.message);
  }
};

export const sendRejectionSMS = async (phoneNumber, message) => {
  try {
    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: '가입승인이 거절되었습니다. 거절 사유: ' + message,
    });
    console.log('거절 SMS 전송 성공');
  } catch (error) {
    console.error('거절 SMS 전송 실패:', error);
    throw new Error('거절 SMS 전송에 실패했습니다');
  }
};

export const sendApprovalSMS = async (phoneNumber, message) => {
  console.log('🚀 ~ sendApprovalSMS ~ message:', message);
  console.log('🚀 ~ sendApprovalSMS ~ phoneNumber:', phoneNumber);
  try {
    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: '가입승인이 완료되었습니다. \n 로그인 하여 서비스를 이용할 수 있습니다.',
    });
    console.log('승인 SMS 전송 성공');
  } catch (error) {
    console.error('승인 SMS 전송 실패:', error);
    throw new Error('승인 SMS 전송에 실패했습니다');
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
