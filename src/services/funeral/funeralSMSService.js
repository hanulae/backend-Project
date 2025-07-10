import coolsms from 'coolsms-node-sdk';
import redis from '../../config/redis.js';
import * as funeralAuthDao from '../../daos/funeral/funeralAuthDao.js';
import { generateVerificationCode } from '../../utils/codeGenerator.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js'; // 실제 경로에 맞게 import
import * as managerUserDao from '../../daos/manager/managerUserDao.js';

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
    // 1. 중복 체크
    const existingManager = await managerUserDao.findByPhone(phoneNumber);
    const existingFuneral = await funeralUserDao.findByPhone(phoneNumber);
    if (existingManager || existingFuneral) {
      throw new Error('이미 등록된 전화번호입니다.');
    }

    // 2. 인증번호 생성 및 저장
    const code = generateVerificationCode();
    await redis.set(`sms:${phoneNumber}`, code, 'EX', EXPIRE_TIME);

    // 3. SMS 발송
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
