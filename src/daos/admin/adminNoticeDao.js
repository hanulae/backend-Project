import db from '../../models/index.js';

export const createNotice = async ({ title, content, isVisible, userType }) => {
  return await db.Notice.create({
    title,
    content,
    isVisible,
    userType,
  });
};

export const updateNotice = async (noticeId, { title, content, isVisible, userType }) => {
  try {
    const notice = await db.Notice.findByPk(noticeId);
    if (!notice) return null;

    await notice.update({
      title: title ?? notice.title,
      content: content ?? notice.content,
      isVisible: isVisible ?? notice.isVisible,
      userType: userType ?? notice.userType,
    });

    return notice;
  } catch (error) {
    console.error('공지사항 수정 DAO 오류:', error.message);
    throw error;
  }
};

export const deleteNotice = async (noticeId) => {
  try {
    const deleted = await db.Notice.destroy({
      where: { noticeId },
    });
    return deleted > 0;
  } catch (error) {
    console.error('공지사항 삭제 DAO 오류:', error.message);
    throw error;
  }
};

export const getNoticeList = async ({ userType, isVisible }) => {
  const where = {};
  if (userType) where.userType = userType;
  if (typeof isVisible !== 'undefined')
    where.isVisible = isVisible === 'true' || isVisible === true;

  return await db.Notice.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
};
