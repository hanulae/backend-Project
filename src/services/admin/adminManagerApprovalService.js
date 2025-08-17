/**
 * 관리자 상조팀장 가입 승인 서비스
 * - 승인/요청 목록 조회, 제출 문서 조회, 승인/거절 처리, 승인/거절 SMS 발송
 * - 승인/거절 시 외부 연계를 최소화하고, 예외는 서비스 레이어에서 명확한 메시지로 throw 합니다.
 */
import * as managerApprovalDao from '../../daos/admin/adminManagerApprovalDao.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';
import coolsms from 'coolsms-node-sdk';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

/**
 * 상조팀장 승인/요청 목록 그룹 조회
 *
 * 동작:
 * - 승인됨(true)/요청중(false) 상태별로 상조팀장 목록을 조회하여 그룹화합니다.
 *
 * 반환:
 * - { approved: Array<Manager>, requests: Array<Manager> }
 */
export const getGroupedManagerList = async () => {
  const approved = await managerApprovalDao.findByApprovalStatus(true);
  const requests = await managerApprovalDao.findByApprovalStatus(false);
  return {
    approved,
    requests,
  };
};

/**
 * 승인 대기중인 상조팀장 목록 조회
 *
 * 반환:
 * - Array<Manager>: 승인 미완료 항목
 */
export const getPendingManagers = async () => {
  return await managerApprovalDao.findAllPending();
};

/**
 * 제출 파일(추가 문서) 조회
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 *
 * 반환:
 * - Object | null: 제출 파일 메타(DAO 스키마에 따름)
 */
export const getManagerDocument = async (managerId) => {
  return await managerApprovalDao.findManagerFile(managerId);
};

/**
 * 상조팀장 가입 승인/거절 상태 업데이트
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 * - isApproved: boolean — true=승인, false=거절
 *
 * 반환:
 * - boolean | number | any: DAO 업데이트 결과(구현에 따름)
 */
export const setApprovalStatus = async (managerId, isApproved) => {
  return await managerApprovalDao.updateApproval(managerId, isApproved);
};

/**
 * 거절 안내 SMS 발송(CoolSMS)
 *
 * 입력:
 * - phoneNumber: string — 수신자 번호
 * - message: string — 거절 사유 등 안내 메시지
 *
 * 동작/주의:
 * - 실패 시 예외를 throw하여 상위 레이어에서 적절히 처리하도록 위임합니다.
 */
export const sendRejectionSMS = async (phoneNumber, message) => {
  console.log('🚀 ~ sendRejectionSMS ~ phoneNumber, message:', phoneNumber, message);
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

/**
 * 승인 안내 SMS 발송(CoolSMS)
 *
 * 입력:
 * - phoneNumber: string — 수신자 번호
 * - message: string — (옵션) 추가 안내 메시지
 *
 * 동작/주의:
 * - 실패 시 예외를 throw하여 상위 레이어에서 적절히 처리하도록 위임합니다.
 */
export const sendApprovalSMS = async (phoneNumber, message) => {
  console.log('🚀 ~ sendApprovalSMS ~ phoneNumber, message:', phoneNumber, message);
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

/**
 * 상조팀장 단건 조회
 *
 * 입력:
 * - managerId: string — 상조팀장 PK
 *
 * 반환:
 * - Manager: 대상 레코드
 *
 * 예외:
 * - 대상 없음 또는 DAO 오류 시 명확한 메시지의 Error throw
 */
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
