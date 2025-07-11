import * as adminNoticeDao from '../../daos/admin/adminNoticeDao.js';

export const createNotice = async ({ title, content, isVisible, userType }) => {
  // userType 값 검증 (옵션)
  const validTypes = ['manager', 'funeral', 'all'];
  if (!validTypes.includes(userType)) {
    throw new Error('userType은 manager, funeral, all 중 하나여야 합니다.');
  }

  return await adminNoticeDao.createNotice({
    title,
    content,
    isVisible,
    userType,
  });
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

export const getNoticeList = async ({ userType, isVisible }) => {
  return await adminNoticeDao.getNoticeList({ userType, isVisible });
};
