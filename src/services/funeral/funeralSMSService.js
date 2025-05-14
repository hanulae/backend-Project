import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import { generateVerificationCode } from '../../utils/codeGenerator.js';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);
const EXPIRE_TIME = 300; // 5분

export const sendVerificationSMS = async (phoneNumber) => {
  const code = generateVerificationCode();
  await redis.set(`sms:${phoneNumber}`, code, 'EX', EXPIRE_TIME);

  await client.sendOne({
    to: phoneNumber,
    from: process.env.COOLSMS_SENDER_NUMBER,
    text: `장례식장 인증번호: [${code}]`,
  });
};

export const verifyCode = async (phoneNumber, code) => {
  const storedCode = await redis.get(`sms:${phoneNumber}`);
  if (!storedCode || storedCode !== code) throw new Error('인증 실패');
  await redis.del(`sms:${phoneNumber}`);
  return true;
};
