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
