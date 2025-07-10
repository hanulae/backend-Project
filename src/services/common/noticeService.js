// services/common/noticeService.js
import * as noticeDao from '../../daos/common/noticeDao.js';

export const getNoticeList = async () => {
  return await noticeDao.findAllVisible();
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
