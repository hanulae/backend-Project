import db from '../../models/index.js';

export const insertNotice = async ({ title, content, isVisible }) => {
  try {
    const notice = await db.Notice.create({
      title,
      content,
      isVisible,
    });
    return notice;
  } catch (error) {
    console.error('공지사항 등록 DAO 오류:', error.message);
    throw error;
  }
};

export const updateNotice = async (noticeId, { title, content, isVisible }) => {
  try {
    const notice = await db.Notice.findByPk(noticeId);
    if (!notice) return null;

    await notice.update({
      title: title ?? notice.title,
      content: content ?? notice.content,
      isVisible: isVisible ?? notice.isVisible,
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
