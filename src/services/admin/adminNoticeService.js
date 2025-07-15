import * as adminNoticeDao from '../../daos/admin/adminNoticeDao.js';
import logger from '../../config/logger.js';

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
