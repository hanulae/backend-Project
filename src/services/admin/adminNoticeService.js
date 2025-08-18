/**
 * 관리자 공지사항 서비스
 * - 공지 생성/수정/삭제 및 목록 조회를 제공합니다.
 * - 서비스 계층에서 입력 유효성 검증(필요 시)과 일관된 예외 메시지 반환을 담당합니다.
 */
import * as adminNoticeDao from '../../daos/admin/adminNoticeDao.js';
import logger from '../../config/logger.js';

/**
 * 공지 생성
 *
 * 입력:
 * - title: string — 공지 제목(필수)
 * - content: string — 공지 내용(필수)
 * - isVisible: boolean — 노출 여부(선택)
 * - userType: 'manager' | 'funeral' | 'all' — 대상 사용자 구분(필수)
 *
 * 동작:
 * - userType 값의 유효성을 검사한 후 DAO를 통해 공지 레코드를 생성합니다.
 *
 * 반환:
 * - Object: 생성된 공지 레코드(DAO 스키마에 따름)
 *
 * 예외:
 * - userType 값이 유효하지 않거나 DAO 오류 발생 시 Error throw
 */
export const createNotice = async ({ title, content, isVisible, userType }) => {
  try {
    // userType 값 검증 (옵션)
    const validTypes = ['manager', 'funeral', 'all'];
    if (!validTypes.includes(userType)) {
      throw new Error('userType은 manager, funeral, all 중 하나여야 합니다.');
    }

    // 공지사항 생성
    return await adminNoticeDao.createNotice({
      title,
      content,
      isVisible,
      userType,
    });
  } catch (error) {
    // 오류 발생 시 로깅 및 오류 메시지 반환
    logger.error('공지사항 생성 중 오류 발생:', error.message);
    throw new Error('공지사항을 생성하는 데 실패했습니다.');
  }
};

/**
 * 공지 수정
 *
 * 입력:
 * - noticeId: string — 수정 대상 공지 ID
 * - updateData: Partial<{ title: string; content: string; isVisible: boolean; userType: string }>
 *
 * 동작:
 * - 전달된 수정 필드만 반영하여 공지 내용을 업데이트합니다.
 *
 * 반환:
 * - Object | boolean | number: DAO 업데이트 결과(구현에 따라 상이)
 *
 * 예외:
 * - DAO/DB 오류 발생 시 래핑된 Error throw
 */
export const updateNotice = async (noticeId, updateData) => {
  try {
    // 공지사항 업데이트
    return await adminNoticeDao.updateNotice(noticeId, updateData);
  } catch (error) {
    // 오류 발생 시 로깅 및 오류 메시지 반환
    logger.error('공지사항 수정 중 오류 발생:', error.message);
    throw new Error('공지사항을 수정하는 데 실패했습니다.');
  }
};

/**
 * 공지 삭제
 *
 * 입력:
 * - noticeId: string — 삭제 대상 공지 ID
 *
 * 반환:
 * - boolean | number | any: DAO 삭제 결과(구현에 따라 상이)
 *
 * 예외:
 * - DAO/DB 오류 발생 시 Error throw
 */
export const deleteNotice = async (noticeId) => {
  try {
    return await adminNoticeDao.deleteNotice(noticeId);
  } catch (error) {
    console.error('공지사항 삭제 서비스 오류:', error.message);
    throw error;
  }
};

/**
 * 공지 목록 조회
 *
 * 입력:
 * - params: { userType?: 'manager' | 'funeral' | 'all'; isVisible?: boolean }
 *   - userType: 대상 사용자 타입으로 필터링(선택)
 *   - isVisible: 노출 여부로 필터링(선택)
 *
 * 반환:
 * - Array: 조건에 맞는 공지 목록
 *
 * 비고:
 * - 필터 파라미터가 없으면 전체 공지를 반환합니다.
 */
export const getNoticeList = async ({ userType, isVisible }) => {
  return await adminNoticeDao.getNoticeList({ userType, isVisible });
};
