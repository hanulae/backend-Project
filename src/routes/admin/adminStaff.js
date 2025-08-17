/**
 * 관리자 스태프 관리 라우터
 * - 관리자 직원(스태프) 생성, 조회(전체/단건), 수정, 삭제 API 제공
 * - 모든 엔드포인트는 관리자 인증이 필요합니다.
 * 후 개발 API 용
 */
// routes/admin/adminStaffRouter.js
import express from 'express';
import * as adminStaffService from '../../services/admin/adminStaffService.js';
import adminAuthMiddleware from '../../middlewares/adminAuthMiddleware.js';

const router = express.Router();

/**
 * [POST] /admin/staff/create
 * 관리자 직원 생성 (인증 필요)
 *
 * Headers:
 * - Authorization: Bearer <JWT>
 *
 * Body:
 * - email: string (필수)
 * - password: string (필수)
 * - name: string (필수)
 * - adminStaffRole: string (필수, 역할)
 * - permissions: string[] | object (필수, 권한 목록)
 *
 * 동작:
 * - 토큰에서 adminId 추출 후 요청 바디와 함께 서비스 계층으로 전달하여 생성 처리
 *
 * Response:
 * - 201 Created: { message: '관리자 직원 생성 완료', data: Object }
 * - 500 Internal Server Error
 */
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

/**
 * [GET] /admin/staff/search/all
 * 관리자 직원 전체 조회 (인증 필요)
 *
 * 동작:
 * - 토큰에서 adminId를 사용해 해당 관리자 소속의 직원 목록을 조회
 *
 * Response:
 * - 200 OK: { message: '관리자 직원 전체 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
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

/**
 * [GET] /admin/staff/search/:adminStaffId
 * 관리자 직원 단건 조회 (인증 필요)
 *
 * Path Params:
 * - adminStaffId: string (필수)
 *
 * Response:
 * - 200 OK: { message: '관리자 직원 조회 성공', data: Object }
 * - 404 Not Found: 대상 직원 없음
 */
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

/**
 * [PATCH] /admin/staff/edit/:adminStaffId
 * 관리자 직원 수정 (인증 필요)
 *
 * Path Params:
 * - adminStaffId: string (필수)
 *
 * Body:
 * - 부분 업데이트 가능한 필드들(예: name, adminStaffRole, permissions 등)
 *
 * Response:
 * - 200 OK: { message: '관리자 직원 수정 완료', data: Object }
 * - 500 Internal Server Error
 */
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

/**
 * [DELETE] /admin/staff/delete/:adminStaffId
 * 관리자 직원 삭제 (인증 필요)
 *
 * Path Params:
 * - adminStaffId: string (필수)
 *
 * Response:
 * - 200 OK: { message: '관리자 직원 삭제 완료' }
 * - 500 Internal Server Error
 */
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
