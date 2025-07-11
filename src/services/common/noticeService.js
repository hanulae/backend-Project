// services/common/noticeService.js
import * as noticeDao from '../../daos/common/noticeDao.js';
import logger from '../../config/logger.js';

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

export const getNoticeDetail = async (noticeId) => {
  const notice = await noticeDao.findById(noticeId);
  if (!notice) {
    throw new Error('공지사항을 찾을 수 없습니다.');
  }
  return notice;
};

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
