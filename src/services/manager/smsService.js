import coolsms from 'coolsms-node-sdk';
import redis from '../config/redis.js';
import { generateVerificationCode } from '../utils/codeGenerator.js';
import logger from '../../lib/logger.js';
import dotenv from 'dotenv';
import userDao from '../dao/userDao.js';
import contentsDao from '../dao/contentsDao.js';
import { generateRefreshToken, generateToken } from '../config/jwt.js';
import notificationSettingDao from '../dao/notificationSettingDao.js';

dotenv.config();

const mysms = coolsms.default;
const coolsmsClient = new mysms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const CODE_EXPIRY = 300; // 5분
const MAX_ATTEMPTS = 5; // 최대 시도 횟수
const ATTEMPT_EXPIRY = 3600; // 1시간

export const sendVerificationSMS = async (phoneNumber) => {
  try {
    // 1. 전화번호 형식 검증 (대한민국 기준 전화번호 유효성 검사)
    const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new Error('유효한 전화번호 형식이 아닙니다.');
    }

    // 2. 요청 횟수 제한 확인
    const attempts = await redis.get(`attempts:${phoneNumber}`);
    if (attempts && parseInt(attempts) >= MAX_ATTEMPTS) {
      throw new Error('인증 시도 횟수 5회를 초과했습니다. 1시간 후 다시 시도해주세요.');
    }

    // 3. 이전 요청과의 시간 간격 확인 (1분)
    const lastRequest = await redis.get(`lastRequest:${phoneNumber}`);
    if (lastRequest && Date.now() - parseInt(lastRequest) < 60000) {
      throw new Error('1분 후 다시 시도해주세요.');
    }

    const verificationCode = generateVerificationCode();

    // 4. Redis 저장 및 시도 횟수 증가
    await Promise.all([
      redis.set(`sms:${phoneNumber}`, verificationCode, 'EX', CODE_EXPIRY),
      redis.set(`attempts:${phoneNumber}`, 0, 'EX', ATTEMPT_EXPIRY),
      redis.set(`lastRequest:${phoneNumber}`, Date.now(), 'EX', 60),
      redis.expire(`attempts:${phoneNumber}`, ATTEMPT_EXPIRY),
    ]);

    const message = await coolsmsClient.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: `바나나창고 인증번호는 [${verificationCode}] 입니다. 5분 내에 인증해주세요.`,
    });

    logger.info(`인증코드 ${verificationCode}가 ${phoneNumber}로 전송되었습니다.`);

    return message;
  } catch (error) {
    logger.error('SMS 전송 중 오류 발생:', error);
    throw error;
  }
};

export const verifyCode = async (phoneNumber, code, smsAgreed, os, version) => {
  try {
    // 1. 입력값 검증
    if (!phoneNumber || !code) {
      throw new Error('전화번호와 인증코드는 필수값 입니다.');
    }

    // 관리자 계정 인증
    if (phoneNumber === process.env.ADMIN_PHONE_NUMBER && code === process.env.ADMIN_CODE) {
      const user = await userDao.getUserPhoneNumber(phoneNumber);

      // 1. 알림 설정 상태 확인
      // 1-1. 해당 userId로 알림이 등록 되어 있는지 확인
      const checkAboutNotification = await notificationSettingDao.checkAboutNotification(
        user.userId,
      );

      // 1-1-1. 알림이 등록되어 있지않은경우 해당 유저의 id로 새로운 알림 설정 값을 등록해줌
      if (!checkAboutNotification) {
        await notificationSettingDao.create(user.userId, smsAgreed);
      }

      // 1-1-2. 알림이 등록되어 있는경우 해당 유저의 id로 알림 설정 값을 업데이트 해줌
      if (checkAboutNotification) {
        await notificationSettingDao.updateNotification(user.userId, smsAgreed);
      }

      // 관리자 계정 토큰 생성
      const accessToken = generateToken({ userId: user.userId });
      const refreshToken = generateRefreshToken({ userId: user.userId });
      const contentsList = contentsDao.listGet();

      return {
        isUser: true,
        user,
        accessToken,
        refreshToken,
        contentsList,
      };
    }

    // 2. 인증코드 형식 검증
    if (!/^\d{6}$/.test(code)) {
      throw new Error('유효하지 않은 인증코드 형식입니다.');
    }

    const storedCode = await redis.get(`sms:${phoneNumber}`);

    // 3. 인증코드 존재 여부 확인
    if (!storedCode) {
      throw new Error('유효한 인증 코드가 없습니다.');
    }

    // 4. 인증코드 일치 여부 확인
    if (storedCode !== code) {
      // 실패 횟수 증가
      // await redis.incr(`verifyAttempts:${phoneNumber}`);
      throw new Error('잘못된 인증 코드입니다. 다시 확인해주세요');
    }

    // 5. 인증 성공 시 처리
    await Promise.all([
      redis.del(`sms:${phoneNumber}`),
      redis.del(`attempts:${phoneNumber}`),
      redis.del(`verifyAttempts:${phoneNumber}`),
      redis.del(`lastRequest:${phoneNumber}`),
    ]);

    // 전화번호를 통한 유저 정보 조회
    const user = await userDao.getUserPhoneNumber(phoneNumber);

    // 신규회원인지 기존회원인지 확인
    if (user) {
      // 기존 회원일 경우
      // 1. 알림 설정 상태 확인
      // 1-1. 해당 userId로 알림이 등록 되어 있는지 확인
      const checkAboutNotification = await notificationSettingDao.checkAboutNotification(
        user.userId,
      );

      // 1-1-1. 알림이 등록되어 있지않은경우 해당 유저의 id로 새로운 알림 설정 값을 등록해줌
      if (!checkAboutNotification) {
        await notificationSettingDao.create(user.userId, smsAgreed);
      }

      // 1-1-2. 알림이 등록되어 있는경우 해당 유저의 id로 알림 설정 값을 업데이트 해줌
      if (checkAboutNotification) {
        await notificationSettingDao.updateNotification(user.userId, smsAgreed);
      }

      // 2. 토큰 생성
      const accessToken = generateToken({ userId: user.userId });
      const refreshToken = generateRefreshToken({ userId: user.userId });
      const contentsList = contentsDao.listGet();

      // 3. 버전 확인 및 DB 정보 업데이트
      // 3-1. 앱 버전 1.0.7 업데이트 이후 조건 제거
      if (version && os) {
        const checkUserVersion = await userDao.checkUserVersion(user.userId);
        const versionField = `${os}Version`;

        if (checkUserVersion[versionField] !== version) {
          const updateMethodName =
            os === 'ios' ? 'updateUserIosVersion' : 'updateUserAndroidVersion';

          await userDao[updateMethodName](user.userId, version);
        }
      }

      return {
        isUser: true,
        user,
        accessToken,
        refreshToken,
        contentsList,
      };
    } else {
      return false;
    }
  } catch (error) {
    logger.error('인증코드 확인 중 오류 발생:', error);
    throw error;
  }
};
