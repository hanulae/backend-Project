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
      permissions: req.body.permissions, // 프론트에서 전달되는 권한
    };

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
      permissions: req.body.permissions, // 권한 정보
    };

    const updatedStaff = await funeralStaffService.updateStaff(params);
    res.status(200).json({ message: '직원 수정 완료', data: updatedStaff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 직원 삭제
router.delete('/:funeralStaffId', async (req, res) => {
  try {
    const params = { funeralStaffId: req.params.funeralStaffId };
    await funeralStaffService.deleteStaff(params);
    res.status(200).json({ message: '직원 삭제 완료' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 직원 목록 조회 (JWT 토큰 기반)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const funeralId = req.user?.funeralId;
    console.log('🚀 ~ router.post ~ funeralId:', funeralId);
    const staffList = await funeralStaffService.getStaffListByFuneral(funeralId);
    res.status(200).json({ message: '직원 목록 조회 성공', data: staffList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
