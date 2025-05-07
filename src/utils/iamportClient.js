import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });

export const getIamportToken = async () => {
  const { data } = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.IAMPORT_API_KEY,
    imp_secret: process.env.IAMPORT_API_SECRET,
  });

  if (data.code !== 0) {
    throw new Error('아임포트 토큰 발급 실패: ' + data.message);
  }

  return data.response.access_token;
};

// 계좌 예금주 검증
export const verifyAccountOwner = async ({ bankCode, bankNumber }) => {
  const token = await getIamportToken();

  const { data } = await axios.post(
    'https://api.iamport.kr/vbanks/holder',
    {
      bank_code: bankCode,
      bank_num: bankNumber,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (data.code !== 0) {
    throw new Error('계좌 인증 실패: ' + data.message);
  }

  return data.response; // 예: { bank_holder: '홍길동' }
};
