import axios from 'axios';
import { getIamportToken } from '../../utils/iamportClient.js';

export const verifyAccountOwner = async ({ bankCode, bankNumber, name }) => {
  console.log(
    '🚀 ~ verifyAccountOwner ~  bankCode, bankNumber, name :',
    bankCode,
    bankNumber,
    name,
  );
  try {
    // 1. 토큰 발급
    const token = await getIamportToken();

    // 2. 실명 조회 (GET 요청 + 쿼리 파라미터 사용)
    const url = `https://api.iamport.kr/vbanks/holder?bank_code=${bankCode}&bank_num=${bankNumber}`;

    console.log('🚀 ~ verifyAccountOwner ~ url:', url);
    const { data } = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`, // Bearer 꼭 필요
      },
    });

    // 3. 오류 처리
    if (data.code !== 0) {
      throw new Error(`계좌 인증 실패: ${data.message}`);
    }
    console.log('🚀 ~ verifyAccountOwner ~ data:', data.response.bank_holder);
    console.log('🚀 ~ verifyAccountOwner ~ name:', name);
    // 4. 예금주 이름 확인
    const bankHolder = data.response.bank_holder.trim();
    const normalizedBankHolder = bankHolder.normalize('NFC');
    const normalizedName = name.trim().normalize('NFC');

    if (normalizedBankHolder !== normalizedName) {
      throw new Error('예금주가 다릅니다.');
    }

    // 5. 예금주 이름 반환
    return data.response; // ex: { bank_holder: '홍길동' }
  } catch (error) {
    throw new Error(`계좌 인증 중 오류 발생: ${error.message}`);
  }
};
