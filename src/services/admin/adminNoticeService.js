import * as adminNoticeDao from '../../daos/admin/adminNoticeDao.js';

export const createNotice = async (params) => {
  try {
    return await adminNoticeDao.insertNotice(params);
  } catch (error) {
    console.error('공지사항 등록 서비스 오류:', error.message);
    throw error;
  }
};

export const updateNotice = async (noticeId, updateData) => {
  try {
    return await adminNoticeDao.updateNotice(noticeId, updateData);
  } catch (error) {
    console.error('공지사항 수정 서비스 오류:', error.message);
    throw error;
  }
};

export const deleteNotice = async (noticeId) => {
  try {
    return await adminNoticeDao.deleteNotice(noticeId);
  } catch (error) {
    console.error('공지사항 삭제 서비스 오류:', error.message);
    throw error;
  }
};
