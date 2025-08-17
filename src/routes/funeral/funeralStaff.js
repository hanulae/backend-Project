/**
 * 장례식장 직원(스태프) 관리 라우터
 * - 직원 생성/수정/비밀번호 변경/삭제/목록 조회/전화번호 중복 확인/로그인/로그아웃 제공
 * - 대부분의 엔드포인트는 인증 미들웨어가 필요합니다(명시된 경우 제외)
 * - 로그아웃 시 FCM 토큰 비활성화 시도(오류가 나도 로그아웃은 계속 진행)
 */
import express from 'express';
import * as funeralStaffService from '../../services/funeral/funeralStaffService.js';
import authMiddleware from '../../middlewares/authMiddleware.js'; // 토큰 인증 미들웨어
import fcmService from '../../services/common/fcmService.js';

const router = express.Router();

/**
 * [POST] /funeral/staff/create
 * 직원 생성 + 권한 등록 (인증 필요)
 *
 * Headers:
 * - Authorization: Bearer <JWT>
 *
 * Body:
 * - funeralStaffPhoneNumber: string (필수)
 * - funeralStaffName: string (필수)
 * - funeralStaffRole: string (필수)
 * - funeralStaffPassword: string (필수)
 * - funeralPhoneNumber: string (필수, 대표번호)
 * - permissions: string[] | object (필수, 권한 목록)
 *
 * 동작:
 * - 토큰에서 funeralId 추출 후 직원과 권한을 함께 생성
 *
 * Response:
 * - 201 Created: { message: '직원 생성 완료', data: Object }
 * - 401 Unauthorized: 유효하지 않은 사용자
 * - 500 Internal Server Error
 */
// 직원 생성 - JWT에서 funeralId 추출
// 직원 생성 + 권한 등록
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user?.funeralId;

    if (!funeralId) {
      return res.status(401).json({ message: '유효하지 않은 사용자 정보입니다.' });
    }

    const params = {
      funeralId,
      funeralStaffPhoneNumber: req.body.funeralStaffPhoneNumber,
      funeralStaffName: req.body.funeralStaffName,
      funeralStaffRole: req.body.funeralStaffRole,
      funeralStaffPassword: req.body.funeralStaffPassword,
      funeralMainPhoneNumber: req.body.funeralPhoneNumber,
      permissions: req.body.permissions, // 프론트에서 전달되는 권한
    };
    console.log('🚀 ~ router.post ~ params:', params);

    const staff = await funeralStaffService.createStaff(params);
    res.status(201).json({ message: '직원 생성 완료', data: staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [PATCH] /funeral/staff/update/:funeralStaffId
 * 직원 수정 + 권한 수정 (인증 필요)
 *
 * Path Params:
 * - funeralStaffId: string (필수)
 *
 * Body:
 * - funeralStaffPhoneNumber?: string
 * - funeralStaffName?: string
 * - funeralStaffRole?: string
 * - funeralStaffPassword?: string
 * - funeralPhoneNumber?: string
 * - permissions?: string[] | object
 *
 * Response:
 * - 200 OK: { message: '직원 수정 완료', data: Object }
 * - 401 Unauthorized | 500 Internal Server Error
 */
// 직원 수정 + 권한 수정
router.patch('/update/:funeralStaffId', authMiddleware, async (req, res) => {
  try {
    const { funeralStaffId } = req.params;
    const funeralId = req.user?.funeralId;

    if (!funeralId) {
      return res.status(401).json({ message: '유효하지 않은 사용자 정보입니다.' });
    }

    const params = {
      funeralStaffId,
      funeralId,
      funeralStaffPhoneNumber: req.body.funeralStaffPhoneNumber,
      funeralStaffName: req.body.funeralStaffName,
      funeralStaffRole: req.body.funeralStaffRole,
      funeralStaffPassword: req.body.funeralStaffPassword,
      funeralMainPhoneNumber: req.body.funeralPhoneNumber,
      permissions: req.body.permissions, // 권한 정보
    };
    console.log('🚀 ~ router.post ~ params:', params);

    const updatedStaff = await funeralStaffService.updateStaff(params);
    res.status(200).json({ message: '직원 수정 완료', data: updatedStaff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [PATCH] /funeral/staff/updatePassword/:funeralStaffId
 * 직원 비밀번호 수정 (인증 필요)
 *
 * Path Params:
 * - funeralStaffId: string (필수) — 현재 구현은 토큰에서 추출된 ID를 사용
 *
 * Body:
 * - funeralStaffPassword: string (필수)
 *
 * Response:
 * - 200 OK: { message: '비밀번호가 성공적으로 변경되었습니다.' }
 * - 400 Bad Request | 500 Internal Server Error
 */
// 직원 비밀번호 수정
router.patch('/updatePassword/:funeralStaffId', authMiddleware, async (req, res) => {
  try {
    const { funeralStaffId } = req.user;
    console.log('🚀 ~ router.patch ~ funeralStaffId:', funeralStaffId);
    const { funeralStaffPassword } = req.body;
    console.log('🚀 ~ router.patch ~ funeralStaffPassword:', funeralStaffPassword);

    if (!funeralStaffPassword) {
      return res.status(400).json({ message: '새 비밀번호를 입력해주세요.' });
    }

    await funeralStaffService.updateStaffPassword(funeralStaffId, funeralStaffPassword);
    res.status(200).json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [DELETE] /funeral/staff/:funeralStaffId
 * 직원 삭제 (현재 인증 미적용)
 *
 * Path Params:
 * - funeralStaffId: string (필수)
 *
 * Response:
 * - 200 OK: { message: '직원 삭제 완료' }
 * - 500 Internal Server Error
 */
// 직원 삭제
router.delete('/:funeralStaffId', async (req, res) => {
  try {
    const funeralStaffId = req.params.funeralStaffId;
    await funeralStaffService.deleteStaff(funeralStaffId);
    res.status(200).json({ message: '직원 삭제 완료' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [GET] /funeral/staff/list
 * 직원 목록 조회 (인증 필요)
 *
 * Response:
 * - 200 OK: { message: '직원 목록 조회 성공', data: Array }
 * - 500 Internal Server Error
 */
// 직원 목록 조회 (JWT 토큰 기반)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user?.funeralId;
    const staffList = await funeralStaffService.getStaffListByFuneral(funeralId);
    res.status(200).json({ message: '직원 목록 조회 성공', data: staffList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/staff/phoneVerify
 * 직원 전화번호 중복 확인 (인증 필요)
 *
 * Body:
 * - staffPhoneNumber: string (필수)
 *
 * Response:
 * - 200 OK: { message: '사용 가능한 전화번호입니다.' }
 * - 409 Conflict: { message: '이미 사용 중인 전화번호입니다.' }
 * - 500 Internal Server Error
 */
router.post('/phoneVerify', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;
    const { staffPhoneNumber } = req.body;

    // Check if the staff phone number already exists in the specific funeral home
    const staff = await funeralStaffService.getStaffByPhoneNumber(staffPhoneNumber, funeralId);

    if (staff) {
      // If staff exists, return a message indicating the phone number is already in use
      return res.status(409).json({ message: '이미 사용 중인 전화번호입니다.' });
    }

    // If no staff is found, the phone number is available
    res.status(200).json({ message: '사용 가능한 전화번호입니다.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/staff/login
 * 직원 로그인 (공개)
 *
 * Body:
 * - funeralStaffPhoneNumber: string (필수)
 * - funeralStaffPassword: string (필수)
 *
 * Response:
 * - 200 OK: { message: '로그인 성공', ...result }
 * - 401 Unauthorized: 잘못된 자격 증명
 * - 500 Internal Server Error
 */
// 직원 로그인
router.post('/login', async (req, res) => {
  try {
    const { funeralStaffPhoneNumber, funeralStaffPassword } = req.body;

    const result = await funeralStaffService.loginStaff({
      funeralStaffPhoneNumber,
      funeralStaffPassword,
    });

    if (!result) {
      return res.status(401).json({ message: '로그인 실패: 잘못된 전화번호 또는 비밀번호입니다.' });
    }

    res.status(200).json({
      message: '로그인 성공',
      ...result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * [POST] /funeral/staff/logout
 * 직원 로그아웃 (인증 필요)
 *
 * Body:
 * - deviceId?: string (선택, 제공 시 해당 기기만 로그아웃)
 *
 * 동작:
 * - FCM 토큰 비활성화 시도(오류가 나도 로그아웃은 지속)
 *
 * Response:
 * - 200 OK: { message: '로그아웃 성공' }
 * - 500 Internal Server Error
 */
// 직원 로그아웃
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { deviceId } = req.body; // 선택적으로 특정 기기만 로그아웃

    // FCM 토큰 비활성화
    try {
      await fcmService.deactivateUserTokens({
        userId,
        userType,
        deviceId, // deviceId가 없으면 모든 토큰 비활성화
      });
    } catch (fcmError) {
      console.warn('FCM 토큰 비활성화 실패:', fcmError.message);
      // FCM 오류가 있어도 로그아웃은 계속 진행
    }

    res.status(200).json({ message: '로그아웃 성공' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
