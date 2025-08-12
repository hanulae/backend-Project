/**
 * 관리자 출동(배차) 요청 서비스
 * - 관리자/상조팀장/장례식장 기준으로 출동 요청 목록을 조회합니다.
 * - DAO 호출을 래핑하여 서비스 계층에서 에러 메시지를 일관되게 제공합니다.
 */
import * as adminDispatchRequestDao from '../../daos/admin/adminDispatchRequestDao.js';

/**
 * 관리자별 출동 요청 목록 조회
 *
 * 입력:
 * - adminId: string — 관리자 ID
 *
 * 반환:
 * - Array<DispatchRequest>: 출동 요청 목록
 *
 * 예외:
 * - DAO 호출 중 오류 발생 시 Error throw
 */
export const getDispatchRequestsByAdminId = async (adminId) => {
  try {
    return await adminDispatchRequestDao.findDispatchRequestsByAdminId(adminId);
  } catch (error) {
    console.error('Error in service layer:', error);
    throw error;
  }
};

/**
 * 상조팀장별 출동 요청 목록 조회
 *
 * 입력:
 * - managerId: string — 상조팀장 ID
 *
 * 반환:
 * - Array<DispatchRequest>: 출동 요청 목록
 *
 * 예외:
 * - 조회 실패 시 사용자 친화 메시지로 감싼 Error throw
 */
export const getDispatchRequestsByManagerId = async (managerId) => {
  try {
    return await adminDispatchRequestDao.findDispatchRequestsByManagerId(managerId);
  } catch (error) {
    console.error('상조팀장 출동 요청 조회 오류:', error.message);
    throw new Error('상조팀장 출동 요청 조회 실패: ' + error.message);
  }
};

/**
 * 장례식장별 출동 요청 목록 조회
 *
 * 입력:
 * - funeralId: string — 장례식장 ID
 *
 * 반환:
 * - Array<DispatchRequest>: 출동 요청 목록
 *
 * 예외:
 * - 조회 실패 시 사용자 친화 메시지로 감싼 Error throw
 */
export const getDispatchRequestsByFuneralId = async (funeralId) => {
  try {
    return await adminDispatchRequestDao.findDispatchRequestsByFuneralId(funeralId);
  } catch (error) {
    console.error('장례식장 출동 요청 조회 오류:', error.message);
    throw new Error('장례식장 출동 요청 조회 실패: ' + error.message);
  }
};
