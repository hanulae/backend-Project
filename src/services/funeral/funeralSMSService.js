import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import * as funeralAuthDao from '../../daos/funeral/funeralAuthDao.js';
import { generateVerificationCode } from '../../utils/codeGenerator.js';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);
const EXPIRE_TIME = 300; // 5분

export const sendVerificationSMSStaff = async (phoneNumber, funeralId) => {
  try {
    const verifyFuneralId = await funeralAuthDao.findByUserInfo(funeralId);

    if (verifyFuneralId.funeralPhoneNumber !== phoneNumber) {
      throw new Error('대표자 번호가 아닙니다.');
    }

    const code = generateVerificationCode();
    await redis.set(`sms:${phoneNumber}`, code, 'EX', EXPIRE_TIME);

    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
    });
  } catch (error) {
    console.error('Error in sendVerificationSMS:', error.message);
    throw new Error(error.message);
  }
};

export const verifyCodeStaff = async (phoneNumber, code) => {
  const storedCode = await redis.get(`sms:${phoneNumber}`);
  if (!storedCode || storedCode !== code) throw new Error('인증 실패');
  await redis.del(`sms:${phoneNumber}`);
  return true;
};

export const sendVerificationSMSFuneral = async (phoneNumber) => {
  try {
    const code = generateVerificationCode();
    await redis.set(`sms:${phoneNumber}`, code, 'EX', EXPIRE_TIME);

    await client.sendOne({
      to: phoneNumber,
      from: process.env.COOLSMS_SENDER_NUMBER,
      text: `하늘애 인증번호는 [${code}] 입니다. 5분 내에 입력해주세요.`,
    });
  } catch (error) {
    console.error('Error in sendVerificationSMS:', error.message);
    throw new Error(error.message);
  }
};

export const verifyCodeFuneral = async (phoneNumber, code) => {
  const storedCode = await redis.get(`sms:${phoneNumber}`);
  if (!storedCode || storedCode !== code) throw new Error('인증 실패');
  await redis.del(`sms:${phoneNumber}`);
  return true;
};
