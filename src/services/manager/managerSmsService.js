import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import dotenv from 'dotenv';
import path from 'path';
import { generateVerificationCode } from '../../utils/codeGenerator.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

const mysms = coolsms.default;
const smsClient = new mysms(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

const CODE_EXPIRY = 300; // 5분
const ATTEMPT_LIMIT = 5;
const ATTEMPT_EXPIRY = 3600; // 1시간

export const sendVerificationSMS = async (phoneNumber) => {
  const phoneRegex = /^01([0|1|6|7|8|9])-?([0-9]{3,4})-?([0-9]{4})$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new Error('유효한 전화번호 형식이 아닙니다.');
  }

  const attempts = await redis.get(`attempts:${phoneNumber}`);
  if (attempts && parseInt(attempts) >= ATTEMPT_LIMIT) {
    throw new Error('인증 시도 횟수 초과. 1시간 후 다시 시도해주세요.');
  }

  const lastRequest = await redis.get(`lastRequest:${phoneNumber}`);
  if (lastRequest && Date.now() - parseInt(lastRequest) < 60000) {
    throw new Error('1분 후 다시 시도해주세요.');
  }

  const code = generateVerificationCode();

  await Promise.all([
    redis.set(`sms:${phoneNumber}`, code, 'EX', CODE_EXPIRY),
    redis.set(`lastRequest:${phoneNumber}`, Date.now(), 'EX', 60),
    redis.incr(`attempts:${phoneNumber}`),
    redis.expire(`attempts:${phoneNumber}`, ATTEMPT_EXPIRY),
  ]);

  await smsClient.sendOne({
    to: phoneNumber,
    from: process.env.COOLSMS_SENDER_NUMBER,
    text: `바나나창고 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
  });
};

export const verifyCode = async (phoneNumber, inputCode) => {
  const storedCode = await redis.get(`sms:${phoneNumber}`);

  if (!storedCode) {
    throw new Error('인증 코드가 만료되었거나 존재하지 않습니다.');
  }

  if (storedCode !== inputCode) {
    throw new Error('인증 코드가 일치하지 않습니다.');
  }

  await Promise.all([
    redis.del(`sms:${phoneNumber}`),
    redis.del(`attempts:${phoneNumber}`),
    redis.del(`lastRequest:${phoneNumber}`),
  ]);

  return true;
};
