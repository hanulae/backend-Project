import { sendEmail } from '../../utils/mailgunSender.js';
import logger from '../../config/logger.js';
import { storeVerificationCode, verifyCode } from '../../utils/emailStore.js';

// 인증 코드 전송
export const sendVerificationEmail = async (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const subject = '이메일 인증 코드';
  const text = `인증 코드: ${code}`;

  logger.info(`이메일 전송: ${email}, 코드: ${code}`);
  await sendEmail(email, subject, text);
  storeVerificationCode(email, code);
};

// 인증 코드 확인
export const verifyEmailCode = (email, code) => {
  return verifyCode(email, code);
};
