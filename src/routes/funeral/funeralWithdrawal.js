import express from 'express';
import authMiddleware from '../../middlewares/authMiddleware.js';
import accountDeletionService from '../../services/common/accountDeletionService.js';
import {
  sendVerificationSMSFuneral,
  verifyCodeFuneral,
} from '../../services/funeral/funeralSMSService.js';
import logger from '../../config/logger.js';

const router = express.Router();

/**
 * 회원탈퇴 가능 여부 확인
 * GET /api/funeral/withdrawal/check
 */
router.get('/check', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;

    const result = await accountDeletionService.checkDeletionEligibility({
      userId: funeralId,
      userType: 'funeral',
    });

    // Funeral은 캐시가 있어도 탈퇴 가능하지만 안내 메시지 추가
    if (result.canDelete && result.cashInfo?.hasCash) {
      result.cashMessage = `보유 캐시 ${result.cashInfo.amount.toLocaleString()}원은 탈퇴와 함께 소멸됩니다. 환급을 원하시면 고객센터(1588-0000)로 문의해주세요.`;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Funeral withdrawal check failed', error);
    res.status(500).json({
      success: false,
      message: '탈퇴 가능 여부 확인 중 오류가 발생했습니다.',
    });
  }
});

/**
 * SMS 인증코드 발송
 * POST /api/funeral/withdrawal/send-sms
 */
router.post('/send-sms', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;

    // 먼저 탈퇴 가능 여부 확인 (진행 중인 거래만 체크)
    const eligibility = await accountDeletionService.checkDeletionEligibility({
      userId: funeralId,
      userType: 'funeral',
    });

    // Funeral은 active_transactions만 체크 (캐시는 상관없음)
    if (!eligibility.canDelete && eligibility.reason === 'active_transactions') {
      return res.status(400).json({
        success: false,
        message: eligibility.message,
        reason: eligibility.reason,
      });
    }

    // 사용자 정보에서 전화번호 가져오기
    const funeral = await accountDeletionService.getUserInfo(funeralId, 'funeral');
    if (!funeral) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    // SMS 발송
    await sendVerificationSMSFuneral(funeral.funeralPhoneNumber);

    res.status(200).json({
      success: true,
      message: '인증번호가 발송되었습니다.',
      phoneNumber: funeral.funeralPhoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    });
  } catch (error) {
    logger.error('Funeral withdrawal SMS send failed', error);
    res.status(500).json({
      success: false,
      message: '인증번호 발송 중 오류가 발생했습니다.',
    });
  }
});

/**
 * 회원탈퇴 실행 (SMS 인증 포함)
 * POST /api/funeral/withdrawal/delete
 */
router.post('/delete', authMiddleware, async (req, res) => {
  try {
    const { funeralId } = req.user;
    const { smsCode } = req.body;

    if (!smsCode) {
      return res.status(400).json({
        success: false,
        message: '인증번호를 입력해주세요.',
      });
    }

    // 사용자 정보 조회
    const funeral = await accountDeletionService.getUserInfo(funeralId, 'funeral');
    if (!funeral) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    // SMS 인증 확인
    const isVerified = await verifyCodeFuneral(funeral.funeralPhoneNumber, smsCode);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: '인증번호가 올바르지 않습니다.',
      });
    }

    // 탈퇴 처리
    const result = await accountDeletionService.deleteAccount({
      userId: funeralId,
      userType: 'funeral',
      _smsCode: smsCode,
      _phoneNumber: funeral.funeralPhoneNumber,
    });

    // 성공 시 쿠키 삭제
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: '회원탈퇴가 완료되었습니다.',
      data: result,
    });
  } catch (error) {
    logger.error('Funeral withdrawal failed', {
      funeralId: req.user?.funeralId,
      error: error.message,
    });

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
