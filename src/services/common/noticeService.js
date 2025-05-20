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
