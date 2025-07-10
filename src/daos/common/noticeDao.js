// daos/common/noticeDao.js
import db from '../../models/index.js';

export const findAllVisible = async () => {
  try {
    return await db.Notice.findAll({
      where: { isVisible: true },
      order: [['createdAt', 'DESC']],
      attributes: ['noticeId', 'title', 'createdAt'],
    });
  } catch (error) {
    console.error('공지사항 목록 DAO 오류:', error.message);
    throw error;
  }
};

export const findById = async (noticeId) => {
  try {
    return await db.Notice.findOne({
      where: { noticeId, isVisible: true },
      attributes: ['noticeId', 'title', 'content', 'createdAt'],
    });
  } catch (error) {
    console.error('공지사항 상세 DAO 오류:', error.message);
    throw error;
  }
};

export const findNoticesByType = async (userType) => {
  try {
    return await db.Notice.findAll({
      where: { userType },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('공지사항 조회 오류: ' + error.message);
  }
};

export const findAllNotices = async () => {
  try {
    return await db.Notice.findAll({
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('전체 공지사항 조회 오류: ' + error.message);
  }
};
