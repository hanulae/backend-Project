import express from 'express';
import * as managerApprovalService from '../../services/admin/adminManagerApprovalService.js';

const router = express.Router();

// [GET] 가입 요청 목록
router.get('/requests', async (req, res) => {
  try {
    const result = await managerApprovalService.getGroupedManagerList();
    res.status(200).json({ message: '가입 요청 목록 조회 성공', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 가입 승인 또는 거절
router.patch('/requests/approve/:managerId', async (req, res) => {
  try {
    const { managerId } = req.params;
    const { isApproved } = req.body;

    if (typeof isApproved !== 'boolean') {
      return res.status(400).json({ message: 'isApproved는 true 또는 false여야 합니다.' });
    }

    const result = await managerApprovalService.setApprovalStatus(managerId, isApproved);
    res
      .status(200)
      .json({ message: isApproved ? '가입 승인 완료' : '가입 거절 처리 완료', data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
