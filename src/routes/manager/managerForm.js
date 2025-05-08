import express from 'express';
import managerFormService from '../../services/manager/managerFormService.js';
import logger from '../../config/logger.js';

const router = express.Router();

/**
 * 상조팀장 견적 신청서 생성
 */
router.post('/create', async (req, res) => {
  try {
    // 필수 데이터 추가 검증 로직 필요
    const { funeralList, ...managerFormData } = req.body;

    // funeralList가 배열이 아닐 경우 예외 처리
    if (!Array.isArray(funeralList)) {
      return res.status(400).json({ success: false, message: 'funeralList는 배열이어야 합니다.' });
    }

    // 중복 제거
    const uniqueFuneralList = [...new Set(funeralList)];

    if (
      !req.body.chiefMournerName ||
      !req.body.checkInDate ||
      !req.body.checkOutDate ||
      !req.body.funeralList.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: '필수 데이터가 누락되었습니다.',
      });
    }

    const result = await managerFormService.createManagerForm(managerFormData, uniqueFuneralList);

    res.status(201).json(result);
  } catch (error) {
    logger.error('견적 신청서 생성 실패', error);
    res.status(500).json({
      success: false,
      message: '견적 신청서 작성 실패_Server Error',
    });
  }
});

/**
 * 모든 견적 신청 내역 리스트 조회
 */
router.get('/list', async (req, res) => {
  try {
    const { managerId } = req.body; // 추후 토큰으로 처리

    const result = await managerFormService.getManagerFormList(managerId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('견적 내역 조회 실패', error);
    res.status(500).json({
      success: false,
      message: '견적 내역 조회 실패_Server Error',
    });
  }
});

/**
 * 한명의 상주님 견적 신청 내역 리스트 상세 조회
 */
router.get('/detail/:managerFormId', async (req, res) => {
  try {
    const { managerFormId } = req.params;

    if (!managerFormId) {
      return res.status(400).json({
        success: false,
        message: 'managerFormId가 필요합니다.',
      });
    }

    const result = await managerFormService.getManagerFormDetail(managerFormId);

    res.status(200).json(result);
  } catch (error) {
    logger.error('견적 내역 상세 조회 실패', error);
    res.status(500).json({
      success: false,
      message: '견적 내역 상세 조회 실패_Server Error',
    });
  }
});

export default router;
