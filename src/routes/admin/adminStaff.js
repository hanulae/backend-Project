// routes/admin/adminStaffRouter.js
import express from 'express';
import * as adminStaffService from '../../services/admin/adminStaffService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

// ✅ 관리자 직원 생성
router.post('/create', adminAuthMiddleware, async (req, res) => {
  try {
    const adminId = req.user.adminId;

    // 👉 여기서 묶어서 넘김
    const params = {
      adminId,
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      adminStaffRole: req.body.adminStaffRole,
      permissions: req.body.permissions,
    };

    const result = await adminStaffService.createAdminStaff(params);

    res.status(201).json({ message: '관리자 직원 생성 완료', data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ 관리자 직원 전체 조회
router.get('/search/all', adminAuthMiddleware, async (req, res) => {
  try {
    const { adminId } = req.user; // 로그인 인증된 관리자 ID
    const staffList = await adminStaffService.getAllAdminStaff(adminId);
    res.status(200).json({ message: '관리자 직원 전체 조회 성공', data: staffList });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ 관리자 직원 단건 조회
router.get('/search/:adminStaffId', adminAuthMiddleware, async (req, res) => {
  try {
    const { adminStaffId } = req.params;
    const staff = await adminStaffService.getAdminStaffById(adminStaffId);
    res.status(200).json({ message: '관리자 직원 조회 성공', data: staff });
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// ✅ 관리자 직원 수정
router.patch('/edit/:adminStaffId', adminAuthMiddleware, async (req, res) => {
  try {
    const { adminStaffId } = req.params;
    const result = await adminStaffService.updateAdminStaff(adminStaffId, req.body);
    res.status(200).json({ message: '관리자 직원 수정 완료', data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ 관리자 직원 삭제
router.delete('/delete/:adminStaffId', adminAuthMiddleware, async (req, res) => {
  try {
    const { adminStaffId } = req.params;
    await adminStaffService.deleteAdminStaff(adminStaffId);
    res.status(200).json({ message: '관리자 직원 삭제 완료' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
