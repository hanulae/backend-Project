// src/utils/portone.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// 포트원 인증 토큰 요청
export const getPortOneToken = async () => {
  const response = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.PORTONE_API_KEY,
    imp_secret: process.env.PORTONE_API_SECRET,
  });
  return response.data.response.access_token;
};

// 결제 내역 조회
export const verifyPortOnePayment = async (accessToken, imp_uid) => {
  const response = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
    headers: { Authorization: accessToken },
  });
  return response.data.response;
};
