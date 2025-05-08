import express from 'express';
import logger from '../../lib/logger.js';
import { sendVerificationSMS, verifyCode } from '../../services/manager/smsService.js';
import { checkVersionUpdate } from '../services/versionService.js';

const router = express.Router();

router.post('/send-verification', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: '휴대폰 번호를 입력해주세요.',
      });
    }

    if (phoneNumber === process.env.ADMIN_PHONE_NUMBER) {
      return res.status(200).json({
        message: '관리자계정 접속 시도',
        success: true,
      });
    }

    await sendVerificationSMS(phoneNumber);
    res.status(200).json({ message: '인증 코드가 전송되었습니다.', success: true });
  } catch (error) {
    logger.error('메세지 전송 중 오류 발생:', error);
    res.status(400).json({
      success: false,
      message: error.message || '메시지 전송 중 오류가 발생했습니다.',
    });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code, smsAgreed, os, version } = req.body;
    if (!phoneNumber || !code) {
      return res.status(400).json({ error: '휴대폰 번호와 인증 코드가 필요합니다.' });
    }

    // 앱 버전 1.0.7 업데이트 이후 주석 제거
    // if (!version || !os) {
    //   // 앱 버전과 os 정보가 오지 않는경우 구 버전으로 취급
    //   return res.status(400).json({
    //     message: '최신버전의 앱 업데이트가 필요합니다.',
    //   });
    // }

    // 앱 버전 1.0.7 업데이트 이후 조건 제거
    if (version && os) {
      const versionInfo = await checkVersionUpdate(version, os);

      // 필수 강제 업데이트가 있을경우
      if (versionInfo.forceUpdate) {
        return res.status(400).json({
          message:
            '최신 버전의 앱 필수 업데이트가 필요합니다. 계속하시려면 앱을 업데이트 해주세요.',
          updateInfo: versionInfo,
        });
      }

      // 업데이트가 있을경우
      if (versionInfo.updateRequired) {
        return res.status(400).json({
          message: '최신 버전의 앱 업데이트가 있습니다.',
          updateInfo: versionInfo,
        });
      }
    }

    if (phoneNumber === process.env.ADMIN_PHONE_NUMBER && code === process.env.ADMIN_CODE) {
      const result = await verifyCode(phoneNumber, code, smsAgreed);
      return res.status(200).json({
        message: '관리자계정 접속',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        contents: result.contentsList,
        success: true,
      });
    }

    const result = await verifyCode(phoneNumber, code, smsAgreed, os, version);

    if (result.isUser) {
      res.status(200).json({
        message: '기존의 회원 정보로 로그인 되었습니다.',
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        contents: result.contentsList,
        success: true,
      });
    } else {
      res.status(200).json({
        message: '신규 회원 닉네임 입력해주세요.',
        success: false,
      });
    }
  } catch (error) {
    logger.error('인증 코드 확인 중 오류 발생:', error);
    res.status(400).json({ message: error.message || '인증번호 확인에 실패했습니다.' });
  }
});

export default router;
