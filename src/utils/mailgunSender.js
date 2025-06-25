// src/utils/sendEmail.js
import dotenv from 'dotenv';
import path from 'path';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NODE_ENV = process.env.NODE_ENV;

dotenv.config({
  path: path.join(__dirname, `../../.env.${NODE_ENV}`),
});
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  // url: "https://api.eu.mailgun.net"
});

export async function sendEmail(email, subject, text) {
  try {
    const domain = process.env.MAILGUN_DOMAIN;
    console.log('🚀 ~ sendEmail ~ domain:', domain);
    const fromEmail = process.env.MAILGUN_FROM_EMAIL;
    console.log('🚀 ~ sendEmail ~ fromEmail:', fromEmail);
    console.log('메일 전송 시작:', { email, subject, text });

    // ✅ 환경 변수 검증
    if (!process.env.MAILGUN_API_KEY || !domain || !fromEmail) {
      throw new Error('🔑 환경변수(API_KEY, DOMAIN, FROM_EMAIL)가 누락되었습니다.');
    }

    // ✅ 필수 파라미터 검증
    if (!email || !subject || !text) {
      throw new Error('📨 to, subject, text는 모두 필수입니다.');
    }

    console.log('메일 mgmgmgmgmg:', { mg });
    const data = await mg.messages.create(domain, {
      from: `Mailgun Sandbox <${fromEmail}>`,
      to: [email],
      subject,
      text,
    });

    console.log('✅ 메일 전송 성공:', data);
    return data;
  } catch (error) {
    console.error('❌ 메일 전송 실패:', error.message);
    throw error;
  }
}
