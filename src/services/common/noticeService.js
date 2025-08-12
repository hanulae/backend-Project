/**
 * 공지사항 관리 서비스
 * - 공지사항 조회, 상세 조회, 타입별 조회 기능을 제공합니다.
 * - DAO 계층을 통해 데이터베이스와 상호작용하며, 비즈니스 로직을 처리합니다.
 * - 오류 발생 시 적절한 로깅과 사용자 친화적인 오류 메시지를 반환합니다.
 */
// services/common/noticeService.js
import * as noticeDao from '../../daos/common/noticeDao.js';
import logger from '../../config/logger.js';

/**
 * 공지사항 목록 조회
 *
 * 입력:
 * - type: string — 조회할 공지사항 타입 ('all' 또는 특정 타입)
 *
 * 동작:
 * - type이 'all'인 경우: 모든 공지사항을 조회합니다.
 * - type이 특정 값인 경우: 해당 타입의 공지사항만 조회합니다.
 * - DAO의 findAllVisible 메서드를 사용하여 표시 가능한 공지사항만 조회합니다.
 *
 * 반환:
 * - Array<Notice>: 조회된 공지사항 목록
 *
 * 예외:
 * - 데이터베이스 오류 발생 시 로깅 후 사용자 친화적인 오류 메시지로 감싼 Error throw
 */
export const getNoticeList = async (type) => {
  try {
    let notices;

    if (type === 'all') {
      // 모든 공지사항 조회
      notices = await noticeDao.findAllVisible();
    } else {
      // 특정 type의 공지사항 조회
      notices = await noticeDao.findAllVisible(type);
    }

    return notices;
  } catch (error) {
    // 오류 발생 시 로깅 및 오류 메시지 반환
    logger.error('공지사항 조회 중 오류 발생:', error.message);
    throw new Error('공지사항을 조회하는 데 실패했습니다.');
  }
};

/**
 * 공지사항 상세 조회
 *
 * 입력:
 * - noticeId: string — 조회할 공지사항의 고유 ID
 *
 * 동작:
 * - DAO의 findById 메서드를 사용하여 특정 공지사항을 조회합니다.
 * - 공지사항이 존재하지 않는 경우 오류를 발생시킵니다.
 *
 * 반환:
 * - Notice: 조회된 공지사항 객체
 *
 * 예외:
 * - 공지사항이 존재하지 않는 경우: '공지사항을 찾을 수 없습니다.' 오류 메시지
 * - 데이터베이스 오류 발생 시: 원본 오류를 그대로 전파
 */
export const getNoticeDetail = async (noticeId) => {
  const notice = await noticeDao.findById(noticeId);
  if (!notice) {
    throw new Error('공지사항을 찾을 수 없습니다.');
  }
  return notice;
};

/**
 * 타입별 공지사항 목록 조회
 *
 * 입력:
 * - type: 'manager' | 'funeral' | 'all' — 조회할 공지사항 타입
 *
 * 동작:
 * - type에 따라 다른 DAO 메서드를 호출합니다:
 *   * 'manager': 상조팀장용 공지사항 조회
 *   * 'funeral': 장례식장용 공지사항 조회
 *   * 'all': 모든 공지사항 조회
 * - 유효하지 않은 타입인 경우 오류를 발생시킵니다.
 *
 * 반환:
 * - Array<Notice>: 타입별로 필터링된 공지사항 목록
 *
 * 예외:
 * - 유효하지 않은 타입: '유효하지 않은 타입입니다. (manager, funeral, all 중 하나)' 오류 메시지
 * - 데이터베이스 오류 발생 시: console.error로 로깅 후 사용자 친화적인 오류 메시지로 감싼 Error throw
 */
export const getNoticeListByType = async (type) => {
  try {
    let notices;
    if (type === 'manager') {
      notices = await noticeDao.findNoticesByType('manager');
    } else if (type === 'funeral') {
      notices = await noticeDao.findNoticesByType('funeral');
    } else if (type === 'all') {
      notices = await noticeDao.findAllNotices();
    } else {
      throw new Error('유효하지 않은 타입입니다. (manager, funeral, all 중 하나)');
    }
    return notices;
  } catch (error) {
    console.error('공지사항 목록 조회 오류:', error.message);
    throw new Error('공지사항 목록 조회 실패: ' + error.message);
  }
};
