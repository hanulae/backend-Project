import axios from 'axios';
import { getIamportToken } from '../../utils/iamportClient.js';

export const verifyAccountOwner = async ({ bankCode, bankNumber }) => {
  // 1. 토큰 발급
  const token = await getIamportToken();
  console.log('✅ 발급된 액세스 토큰:', token);

  // 2. 실명 조회 (GET 요청 + 쿼리 파라미터 사용)
  const url = `https://api.iamport.kr/vbanks/holder?bank_code=${bankCode}&bank_num=${bankNumber}`;

  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`, // Bearer 꼭 필요
    },
  });

  // 3. 오류 처리
  if (data.code !== 0) {
    throw new Error(`계좌 인증 실패: ${data.message}`);
  }

  // 4. 예금주 이름 반환
  return data.response; // ex: { bank_holder: '홍길동' }
};
