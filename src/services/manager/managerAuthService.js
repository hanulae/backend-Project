import * as managerAuthDao from '../../daos/manager/managerAuthDao.js';
import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import dotenv from 'dotenv';
//import path from 'path';
import { generateVerificationCode } from '../../utils/codeGenerator.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import logger from '../../config/logger.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';

//dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const mysms = coolsms.default;
const smsClient = new mysms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const CODE_EXPIRY = 300; // 5분
const ATTEMPT_LIMIT = 5;
const ATTEMPT_EXPIRY = 3600; // 1시간

// 로그인
export const loginManager = async ({ managerUsername, managerPassword }) => {
  try {
    const manager = await managerAuthDao.findManagerByUsername(managerUsername);
    if (!manager) throw new Error('존재하지 않는 아이디입니다.');
    if (!manager.isApproved) throw new Error('관리자의 승인이 필요합니다.');

    // 비밀번호 비교
    const isPasswordValid = await manager.verifyPassword(managerPassword);
    if (!isPasswordValid) {
      throw new Error('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    const accessToken = generateToken({ managerId: manager.managerId });
    const refreshToken = generateRefreshToken({ managerId: manager.managerId });

    return {
      accessToken,
      refreshToken,
      manager: manager.toSafeObject(),
    };
  } catch (error) {
    console.error('🚀 ~ loginManager ~ error:', error);
    throw new Error('🔴 로그인 오류:' + error.message);
  }
};

// 로그아웃
export const logoutManager = async () => {
  try {
    logger.info('상조팀장 로그아웃 처리');
    return { message: '로그아웃 성공' };
  } catch (error) {
    throw new Error('🔴 로그아웃 오류:' + error.message);
  }
};

// 비밀번호 변경
export const updatePassword = async (params) => {
  try {
    const { managerId, newPassword } = params;

    // 필수정보 확인
    if (!managerId || !newPassword) {
      throw new Error('필수 정보가 누락되었습니다.');
    }
    // 상조팀장 정보 조회
    const manager = await managerAuthDao.findById(managerId);
    if (!manager) throw new Error('상조팀장을 찾을 수 없습니다.');

    const isPasswordValid = await manager.verifyPassword(newPassword);
    if (isPasswordValid) {
      throw new Error('기존 비밀번호가 일치 합니다.');
    }
    const updatedPassword = await managerAuthDao.updatePassword(managerId, newPassword);
    return updatedPassword;
  } catch (error) {
    throw new Error('🔴 비밀번호 변경 오류:' + error.message);
  }
};

// 휴대폰 번호 변경
export const updatePhoneNumber = async (params) => {
  try {
    const { managerId, /*currentPhone,*/ newPhone } = params;

    const manager = await managerAuthDao.findById(managerId);
    if (!manager) throw new Error('상조팀장을 찾을 수 없습니다.');

    // if (manager.managerPhoneNumber !== currentPhone) {
    //   throw new Error('기존 휴대폰 번호가 일치하지 않습니다.');
    // }

    if (manager.managerPhoneNumber === newPhone) {
      throw new Error('새로운 번호가 기존 번호와 동일합니다.');
    }

    // 전화번호 변경 후 갱신된 유저 정보 리턴
    await managerAuthDao.updatePhoneNumber(managerId, newPhone);
    const updatedManager = await managerAuthDao.findById(managerId);

    return updatedManager;
  } catch (error) {
    throw new Error('🔴 휴대폰 번호 변경 오류:' + error.message);
  }
};

// 계좌 정보 변경
export const updateBankAccount = async (params) => {
  try {
    const { managerId, managerBankName, managerBankNumber, managerBankHolder } = params;

    const manager = await managerAuthDao.findById(managerId);
    if (!manager) throw new Error('상조팀장을 찾을 수 없습니다.');

    // 기존 정보와 동일한 경우 변경 안함
    if (manager.managerBankNumber === managerBankNumber) {
      throw new Error('기존 계좌 번호와 동일합니다.');
    }

    // 변경 수행
    await managerAuthDao.updateBankInfo(
      managerId,
      managerBankName,
      managerBankNumber,
      managerBankHolder,
    );

    // 변경 후 정보 반환
    const updatedManager = await managerAuthDao.findById(managerId);
    return updatedManager;
  } catch (error) {
    throw new Error('🔴 계좌 정보 변경 오류:' + error.message);
  }
};

// 아이디 찾기
export const sendVerificationSMS = async (managerPhoneNumber) => {
  const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  if (!phoneRegex.test(managerPhoneNumber)) {
    throw new Error('유효한 전화번호 형식이 아닙니다.');
  }

  const attempts = await redis.get(`attempts:${managerPhoneNumber}`);
  if (attempts && parseInt(attempts) >= ATTEMPT_LIMIT) {
    throw new Error('인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.');
  }

  const lastRequest = await redis.get(`lastRequest:${managerPhoneNumber}`);
  if (lastRequest && Date.now() - parseInt(lastRequest) < 60000) {
    throw new Error('1분 후 다시 시도해주세요.');
  }

  const code = generateVerificationCode();

  await Promise.all([
    redis.set(`sms:${managerPhoneNumber}`, code, 'EX', CODE_EXPIRY),
    redis.set(`lastRequest:${managerPhoneNumber}`, Date.now(), 'EX', 60),
    redis.incr(`attempts:${managerPhoneNumber}`),
    redis.expire(`attempts:${managerPhoneNumber}`, ATTEMPT_EXPIRY),
  ]);

  await smsClient.sendOne({
    to: managerPhoneNumber,
    from: process.env.COOLSMS_SENDER_NUMBER,
    text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
  });
};

export const verifyCode = async (managerPhoneNumber, inputCode) => {
  try {
    // 전화번호에서 하이픈 제거
    const cleanedPhoneNumber = managerPhoneNumber.replace(/-/g, '');
    console.error('🚀 ~ verifyCode ~ cleanedPhoneNumber:', cleanedPhoneNumber);

    const storedCode = await redis.get(`sms:${managerPhoneNumber}`);

    if (!storedCode) {
      throw new Error('인증 코드가 만료되었거나 존재하지 않습니다.');
    }

    if (storedCode !== inputCode) {
      throw new Error('인증 코드가 일치하지 않습니다.');
    }

    // 인증 성공 시: Redis에서 관련 데이터 제거
    await Promise.all([
      redis.del(`sms:${managerPhoneNumber}`),
      redis.del(`attempts:${managerPhoneNumber}`),
      redis.del(`lastRequest:${managerPhoneNumber}`),
    ]);

    // 인증 성공 후, 해당 휴대폰 번호로 가입한 아이디 조회
    const manager = await managerAuthDao.findByPhone(managerPhoneNumber);

    if (!manager) {
      throw new Error('해당 휴대폰 번호로 등록된 아이디가 없습니다.');
    }

    return manager.funeralUsername;
  } catch (error) {
    throw new Error(`인증 실패: ${error.message}`);
  }
};

export const getUserPassword = async (managerId) => {
  try {
    const manager = await managerUserDao.findById(managerId);
    if (!manager) {
      throw new Error('해당 ID의 상조팀장 정보를 찾을 수 없습니다.');
    }
    return manager;
  } catch (error) {
    console.error('🔴 getUserPhone 에러:', error.message);
    throw new Error('전화번호 조회 실패: ' + error.message);
  }
};
