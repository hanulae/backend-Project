import { storeVerificationCode, verifyCode } from '../../utils/emailStore.js';
import { sendEmail } from '../../utils/mailgunSender.js';

export const sendVerificationEmail = async (email) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  await sendEmail(email, '이메일 인증 코드', `인증 코드: ${code}`);
  storeVerificationCode(email, code);
};

export const verifyEmailCode = (email, code) => {
  return verifyCode(email, code);
};
