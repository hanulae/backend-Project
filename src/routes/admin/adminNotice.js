import express from 'express';
import * as adminNoticeService from '../../services/admin/adminNoticeService.js';

const router = express.Router();

// [POST] 공지사항 등록
router.post('/create', async (req, res) => {
  try {
    const { title, content, isVisible } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
    }

    const newNotice = await adminNoticeService.createNotice({
      title,
      content,
      isVisible: isVisible ?? true,
    });

    res.status(201).json({ message: '공지사항 등록 성공', data: newNotice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 수정 추가
router.patch('/update/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { title, content, isVisible } = req.body;

    const updated = await adminNoticeService.updateNotice(noticeId, {
      title,
      content,
      isVisible,
    });

    if (!updated) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '공지사항 수정 성공', data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 삭제 추가
router.delete('/delete/:noticeId', async (req, res) => {
  try {
    const { noticeId } = req.params;
    const result = await adminNoticeService.deleteNotice(noticeId);

    if (!result) {
      return res.status(404).json({ message: '공지사항을 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: '공지사항 삭제 성공' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
