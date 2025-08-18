/**
 * 파일명: managerWithdrawal.js
 * 설명: 상조팀장의 탈퇴 관련 라우터 관리
 */
import express from 'express';
import authMiddleware from '../../middlewares/authMiddleware.js';
import accountDeletionService from '../../services/common/accountDeletionService.js';
import { sendVerificationSMS, verifyCode } from '../../services/manager/managerSmsService.js';
import logger from '../../config/logger.js';

const router = express.Router();

/**
 * @route GET /api/manager/withdrawal/check
 * @desc 회원탈퇴 가능 여부 확인
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.managerId - 상조팀장 ID
 * @returns {Object} 200 - 회원탈퇴 가능 여부 확인 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.get('/check', authMiddleware, async (req, res) => {
  try {
    const { managerId } = req.user;

    const result = await accountDeletionService.checkDeletionEligibility({
      userId: managerId,
      userType: 'manager',
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Manager withdrawal check failed', error);
    res.status(500).json({
      success: false,
      message: '탈퇴 가능 여부 확인 중 오류가 발생했습니다.',
    });
  }
});

/**
 * @route POST /api/manager/withdrawal/send-sms
 * @desc SMS 인증코드 발송
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.managerId - 상조팀장 ID
 * @returns {Object} 200 - SMS 인증코드 발송 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.post('/send-sms', authMiddleware, async (req, res) => {
  try {
    const { managerId } = req.user;

    // 먼저 탈퇴 가능 여부 확인
    const eligibility = await accountDeletionService.checkDeletionEligibility({
      userId: managerId,
      userType: 'manager',
    });

    if (!eligibility.canDelete) {
      return res.status(400).json({
        success: false,
        message: eligibility.message,
        reason: eligibility.reason,
      });
    }

    // 사용자 정보에서 전화번호 가져오기
    const manager = await accountDeletionService.getUserInfo(managerId, 'manager');
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    // SMS 발송
    await sendVerificationSMS(manager.managerPhoneNumber);

    res.status(200).json({
      success: true,
      message: '인증번호가 발송되었습니다.',
      phoneNumber: manager.managerPhoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    });
  } catch (error) {
    logger.error('Manager withdrawal SMS send failed', error);
    res.status(500).json({
      success: false,
      message: '인증번호 발송 중 오류가 발생했습니다.',
    });
  }
});

/**
 * @route POST /api/manager/withdrawal/delete
 * @desc 회원탈퇴 실행 (SMS 인증 포함)
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.managerId - 상조팀장 ID
 * @param {string} req.body.smsCode - SMS 인증코드
 * @returns {Object} 200 - 회원탈퇴 실행 성공
 * @throws {Error} 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.post('/delete', authMiddleware, async (req, res) => {
  try {
    const { managerId } = req.user;
    const { smsCode } = req.body;

    if (!smsCode) {
      return res.status(400).json({
        success: false,
        message: '인증번호를 입력해주세요.',
      });
    }

    // 사용자 정보 조회
    const manager = await accountDeletionService.getUserInfo(managerId, 'manager');
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    // SMS 인증 확인
    const isVerified = await verifyCode(manager.managerPhoneNumber, smsCode);
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: '인증번호가 올바르지 않습니다.',
      });
    }

    // 탈퇴 처리
    const result = await accountDeletionService.deleteAccount({
      userId: managerId,
      userType: 'manager',
      _smsCode: smsCode,
      _phoneNumber: manager.managerPhoneNumber,
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
    logger.error('Manager withdrawal failed', {
      managerId: req.user?.managerId,
      error: error.message,
    });

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
