/**
 * 관리자 장례식장 가입 승인 서비스
 * - 승인/요청 목록 조회, 제출 문서 조회, 승인/거절 처리, 승인/거절 SMS 발송
 */
import * as funeralApprovalDao from '../../daos/admin/adminFuneralApprovalDao.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';
import * as funeralAddDocumentDao from '../../daos/admin/funeralAddDocumentDao.js';
import coolsms from 'coolsms-node-sdk';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

/**
 * 장례식장 승인/요청 목록(문서 포함) 그룹 조회
 *
 * 동작:
 * - 승인됨(true)/요청중(false) 상태별로 장례식장 목록 조회
 * - 각 장례식장에 연결된 추가 제출 문서들(funeralAddDocument)을 병렬로 조회하여 fileUrl 배열로 합성
 *
 * 반환:
 * - { approved: Array<Funeral & { fileUrl: string[] }>, requests: Array<Funeral & { fileUrl: string[] }> }
 *
 * 예외:
 * - 내부 DAO 호출 실패 시 상위에서 처리 가능한 예외 전파
 */
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

/**
 * 승인 대기중인 장례식장 목록 조회
 *
 * 반환:
 * - Array<Funeral>: 승인 미완료 항목
 */
export const getPendingFunerals = async () => {
  return await funeralApprovalDao.findAllPending();
};

/**
 * 제출 문서(파일) 단건/상세 조회
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 *
 * 반환:
 * - Object | null: 장례식장에 연결된 문서(DAO 스키마에 따름)
 */
export const getFuneralDocument = async (funeralId) => {
  return await funeralApprovalDao.findByFuneralId(funeralId);
};

/**
 * 장례식장 가입 승인/거절 처리 및 연계 업데이트
 *
 * 입력:
 * - funeralId: string — 대상 장례식장 ID
 * - isApproved: boolean — true=승인, false=거절
 *
 * 동작:
 * - 대상 존재 여부 확인
 * - 승인 시:
 *   - funeralHome에 연결된 funeralListId가 있으면 해당 리스트의 funeralId/TotalRooms 초기화 업데이트
 * - 승인/거절 공통:
 *   - 대상의 isApproved 값을 갱신하고 저장
 *
 * 반환:
 * - Funeral | null: 갱신된 장례식장 레코드(대상 없음이면 null)
 *
 * 예외:
 * - DAO/저장 오류 시 상세 메시지 포함하여 Error throw
 */
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

/**
 * 거절 안내 SMS 발송(CoolSMS)
 *
 * 입력:
 * - phoneNumber: string — 수신자 번호
 * - message: string — 거절 사유 등 안내 메시지
 *
 * 동작/주의:
 * - 실패 시 예외를 throw하여 상위 레이어에서 적절히 처리하도록 위임
 */
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

/**
 * 승인 안내 SMS 발송(CoolSMS)
 *
 * 입력:
 * - phoneNumber: string — 수신자 번호
 * - message: string — (옵션) 추가 안내 메시지
 *
 * 동작/주의:
 * - 실패 시 예외를 throw하여 상위 레이어에서 적절히 처리하도록 위임
 */
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

/**
 * 장례식장 단건 조회
 *
 * 입력:
 * - funeralId: string
 *
 * 반환:
 * - Funeral: 대상 레코드
 *
 * 예외:
 * - 대상 없음 또는 DAO 오류 시 명확한 메시지의 Error throw
 */
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
