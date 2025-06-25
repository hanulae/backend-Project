import * as funeralAuthDao from '../../daos/funeral/funeralAuthDao.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';
import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import dotenv from 'dotenv';
//import path from 'path';
import { generateVerificationCode } from '../../utils/codeGenerator.js';

//dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const mysms = coolsms.default;
const smsClient = new mysms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const CODE_EXPIRY = 300; // 5분
const ATTEMPT_LIMIT = 5;
const ATTEMPT_EXPIRY = 3600; // 1시간

export const login = async ({ funeralEmail, funeralPassword }) => {
  const funeral = await funeralAuthDao.findByEmail(funeralEmail);
  if (!funeral) {
    throw new Error('등록되지 않은 이메일입니다.');
  }

  if (!funeral.isApproved) {
    throw new Error('관리자 승인 전 계정입니다.');
  }

  // 비밀번호 비교
  const isPasswordValid = await funeral.verifyPassword(funeralPassword);
  if (!isPasswordValid) {
    throw new Error('이메일 또는 비밀번호가 일치하지 않습니다.');
  }

  const accessToken = generateToken({ funeralId: funeral.funeralId });
  const refreshToken = generateRefreshToken({ funeralId: funeral.funeralId });

  return {
    accessToken,
    refreshToken,
    funeral: funeral.toSafeObject(),
  };
};

//비밀번호변경
export const updatePassword = async (params) => {
  try {
    const { funeralId, currentPassword, newPassword } = params;

    // 필수 정보 확인
    if (!funeralId || !currentPassword || !newPassword) {
      throw new Error('필수 정보가 누락되었습니다.');
    }
    // 비밀번호 형식 확인
    if (currentPassword === newPassword) {
      throw new Error('새로운 비밀번호가 기존 비밀번호와 동일합니다.');
    }
    // 장례식장 정보 조회
    const funeral = await funeralAuthDao.findById(funeralId);
    if (!funeral) throw new Error('장례식장을 찾을 수 없습니다.');

    // 비밀번호가 현재 비밀번호와 동일한지 확인
    const isPasswordValid = await funeral.verifyPassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('기존 비밀번호가 일치하지 않습니다.');
    }

    return await funeralAuthDao.updatePassword(funeralId, newPassword);
  } catch (error) {
    console.error('🔴 비밀번호 변경 오류:' + error.message);
    throw new Error('🔴 비밀번호 변경 오류:' + error.message);
  }
};

// 휴대폰 번호 변경
export const updatePhoneNumber = async (params) => {
  try {
    const { funeralId, currentPhone, newPhone } = params;

    const funeral = await funeralAuthDao.findById(funeralId);
    if (!funeral) throw new Error('장례식장을 찾을 수 없습니다.');

    if (funeral.funeralPhoneNumber !== currentPhone) {
      throw new Error('기존 휴대폰 번호가 일치하지 않습니다.');
    }

    if (currentPhone === newPhone) {
      throw new Error('새로운 번호가 기존 번호와 동일합니다.');
    }

    // 전화번호 변경 후 갱신된 유저 정보 리턴
    await funeralAuthDao.updatePhoneNumber(funeralId, newPhone);
    const updatedFuneral = await funeralAuthDao.findById(funeralId);

    return updatedFuneral;
  } catch (error) {
    console.error('🔴 휴대폰 번호 변경 오류:' + error.message);
    throw new Error('🔴 휴대폰 번호 변경 오류:' + error.message);
  }
};

// 계좌 정보 변경
export const updateBankAccount = async (params) => {
  try {
    const { funeralId, funeralBankName, funeralBankNumber, funeralBacnkHolder } = params;

    const funeral = await funeralAuthDao.findById(funeralId);
    if (!funeral) throw new Error('상조팀장을 찾을 수 없습니다.');

    // 기존 정보와 동일한 경우 변경 안함
    if (funeral.managerBankNumber === funeralBankNumber) {
      throw new Error('기존 계좌 번호와 동일합니다.');
    }

    // 변경 수행
    await funeralAuthDao.updateBankInfo(
      funeralId,
      funeralBankName,
      funeralBankNumber,
      funeralBacnkHolder,
    );

    // 변경 후 정보 반환
    const updatedFuneral = await funeralAuthDao.findById(funeralId);
    return updatedFuneral;
  } catch (error) {
    throw new Error('🔴 계좌 정보 변경 오류:' + error.message);
  }
};

export const updatePhone = async (funeralId, newPhone) => {
  try {
    return await funeralAuthDao.updatePhone(funeralId, newPhone);
  } catch (error) {
    throw new Error('전화번호 변경 실패: ' + error.message);
  }
};

export const updateAccount = async (funeralId, bankName, bankNumber) => {
  try {
    return await funeralAuthDao.updateAccount(funeralId, bankName, bankNumber);
  } catch (error) {
    throw new Error('계좌번호 변경 실패: ' + error.message);
  }
};

export const findEmailByPhone = async (phoneNumber) => {
  try {
    const user = await funeralAuthDao.findByPhone(phoneNumber);
    if (!user) throw new Error('일치하는 이메일을 찾을 수 없습니다.');
    return user.funeralEmail;
  } catch (error) {
    console.error('이메일 찾기 오류:', error);
    throw error;
  }
};

// 이메일 찾기
export const sendVerificationSMS = async (funeralPhoneNumber) => {
  const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  if (!phoneRegex.test(funeralPhoneNumber)) {
    throw new Error('유효한 전화번호 형식이 아닙니다.');
  }

  const attempts = await redis.get(`attempts:${funeralPhoneNumber}`);
  if (attempts && parseInt(attempts) >= ATTEMPT_LIMIT) {
    throw new Error('인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.');
  }

  const lastRequest = await redis.get(`lastRequest:${funeralPhoneNumber}`);
  if (lastRequest && Date.now() - parseInt(lastRequest) < 60000) {
    throw new Error('1분 후 다시 시도해주세요.');
  }

  const code = generateVerificationCode();

  await Promise.all([
    redis.set(`sms:${funeralPhoneNumber}`, code, 'EX', CODE_EXPIRY),
    redis.set(`lastRequest:${funeralPhoneNumber}`, Date.now(), 'EX', 60),
    redis.incr(`attempts:${funeralPhoneNumber}`),
    redis.expire(`attempts:${funeralPhoneNumber}`, ATTEMPT_EXPIRY),
  ]);

  await smsClient.sendOne({
    to: funeralPhoneNumber,
    from: process.env.COOLSMS_SENDER_NUMBER,
    text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
  });
};

export const verifyCode = async (funeralPhoneNumber, inputCode) => {
  try {
    const storedCode = await redis.get(`sms:${funeralPhoneNumber}`);

    if (!storedCode) {
      throw new Error('인증 코드가 만료되었거나 존재하지 않습니다.');
    }

    if (storedCode !== inputCode) {
      throw new Error('인증 코드가 일치하지 않습니다.');
    }

    // 인증 성공 시: Redis에서 관련 데이터 제거
    await Promise.all([
      redis.del(`sms:${funeralPhoneNumber}`),
      redis.del(`attempts:${funeralPhoneNumber}`),
      redis.del(`lastRequest:${funeralPhoneNumber}`),
    ]);

    // 인증 성공 후, 해당 휴대폰 번호로 가입한 이메일 조회
    const funeral = await funeralAuthDao.findByPhone(funeralPhoneNumber);

    if (!funeral) {
      throw new Error('해당 휴대폰 번호로 등록된 이메일이 없습니다.');
    }

    return funeral.funeralEmail;
  } catch (error) {
    throw new Error(`인증 실패: ${error.message}`);
  }
};
