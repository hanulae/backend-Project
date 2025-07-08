import express from 'express';
import * as funeralStaffService from '../../services/funeral/funeralStaffService.js';
import authMiddleware from '../../middlewares/authMiddleware.js'; // 토큰 인증 미들웨어

const router = express.Router();

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

export default router;
