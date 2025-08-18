/**
 * 관리자 견적 신청 내역 서비스
 * - 회원별(상조팀장/장례식장) 견적 신청 내역 조회 기능을 제공합니다.
 * - DAO 레이어를 래핑하여 서비스 계층에서 일관된 예외 메시지를 반환합니다.
 */
import * as estimateRequestDao from '../../daos/admin/estimateRequestDao.js';

/**
 * 회원별 견적 신청 내역 조회
 *
 * 입력:
 * - userId: string — 조회 대상 사용자 ID
 * - userType: 'manager' | 'funeral' — 사용자 유형(상조팀장/장례식장)
 *
 * 동작:
 * - userType에 따라 매니저/장례식장 테이블의 견적 신청 내역을 DAO를 통해 조회합니다.
 *
 * 반환:
 * - Array<EstimateRequest>: 해당 사용자의 견적 신청 목록
 *
 * 예외:
 * - userType이 유효하지 않은 경우 Error('유효하지 않은 userType ...') throw
 * - DAO/DB 조회 실패 시 오류 로그 후 래핑된 Error throw
 */
export const getEstimateRequestsByUserId = async (userId, userType) => {
  try {
    if (userType === 'manager') {
      return await estimateRequestDao.findEstimateRequestsByManagerId(userId);
    } else if (userType === 'funeral') {
      return await estimateRequestDao.findEstimateRequestsByFuneralId(userId);
    }
    throw new Error('유효하지 않은 userType입니다. (manager 또는 funeral)');
  } catch (error) {
    console.error('특정 회원별 견적 신청 내역 조회 오류:', error.message);
    throw new Error('견적 신청 내역 조회 실패: ' + error.message);
  }
};
