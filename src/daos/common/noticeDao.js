// daos/common/noticeDao.js
import db from '../../models/index.js';

export const findAllVisible = async (type) => {
  try {
    const whereCondition = { isVisible: true };

    // type이 'all'이 아니고, 정의된 경우에만 userType 조건 추가
    if (type && type !== 'all') {
      whereCondition.userType = type;
    }

    return await db.Notice.findAll({
      where: whereCondition,
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
