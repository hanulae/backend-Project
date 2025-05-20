// routes/common/noticeRoute.js
import express from 'express';
import * as noticeService from '../../services/common/noticeService.js';

const router = express.Router();

// [GET] 공지사항 목록
router.get('/list', async (req, res) => {
  try {
    const list = await noticeService.getNoticeList();
    res.status(200).json({ message: '공지사항 목록 조회 성공', data: list });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// [GET] 공지사항 상세
router.get('/:noticeId', async (req, res) => {
  try {
    const detail = await noticeService.getNoticeDetail(req.params.noticeId);
    res.status(200).json({ message: '공지사항 상세 조회 성공', data: detail });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

export default router;
