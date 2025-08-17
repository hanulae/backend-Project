/**
 * 상조팀장 은행 계좌 인증 서비스
 * - Iamport API를 사용하여 은행 계좌의 예금주 실명을 검증하는 기능을 제공합니다.
 * - 계좌번호와 은행코드를 통해 실제 예금주명을 조회하고, 입력된 이름과 일치 여부를 확인합니다.
 * - 한국어 이름의 정규화 처리를 통해 다양한 형태의 이름 입력을 지원합니다.
 * - 계좌 인증 실패 시 적절한 오류 메시지를 제공합니다.
 */
import axios from 'axios';
import { getIamportToken } from '../../utils/iamportClient.js';

/**
 * 은행 계좌 예금주 실명 인증
 *
 * 입력:
 * - bankCode: string — 은행 코드 (Iamport에서 제공하는 은행 식별 코드)
 * - bankNumber: string — 계좌번호 (하이픈 제외한 순수 숫자)
 * - name: string — 검증할 예금주 이름
 *
 * 동작:
 * 1) Iamport API 액세스 토큰 발급
 * 2) Iamport API를 통해 계좌번호와 은행코드로 실제 예금주명 조회
 * 3) API 응답에서 예금주명 추출 및 정규화 처리
 * 4) 입력된 이름과 실제 예금주명 비교 검증
 * 5) 일치하는 경우 예금주 정보 반환, 불일치 시 오류 발생
 *
 * API 통신:
 * - URL: https://api.iamport.kr/vbanks/holder
 * - Method: GET
 * - Query Parameters: bank_code, bank_num
 * - Headers: Authorization: Bearer {token}
 *
 * 이름 정규화:
 * - trim(): 앞뒤 공백 제거
 * - normalize('NFC'): 유니코드 정규화 (한국어 이름의 다양한 표현 통일)
 * - 예: '홍길동'과 '홍길동'의 미세한 차이를 정규화하여 비교
 *
 * 검증 과정:
 * - API 응답 코드가 0인지 확인 (성공 응답)
 * - 응답에서 bank_holder 추출
 * - 입력된 이름과 실제 예금주명을 정규화하여 비교
 * - 일치 여부에 따른 결과 반환
 *
 * 반환:
 * - Object: { bank_holder: string } — 실제 예금주명이 포함된 응답 객체
 *
 * 예외:
 * - 토큰 발급 실패: getIamportToken에서 발생한 오류 전파
 * - API 통신 실패: axios에서 발생한 네트워크 오류 전파
 * - API 응답 오류: '계좌 인증 실패: {API 오류 메시지}' 형태로 Error throw
 * - 예금주 불일치: '예금주가 다릅니다.' 형태로 Error throw
 * - 기타 오류: '계좌 인증 중 오류 발생: {원인}' 형태로 Error throw
 *
 * 로깅:
 * - 입력 파라미터: bankCode, bankNumber, name
 * - API 요청 URL
 * - API 응답 데이터 (예금주명)
 * - 검증할 이름
 *
 * 보안:
 * - Iamport API 토큰을 사용하여 안전한 계좌 정보 조회
 * - 실제 은행 시스템과 연동하여 정확한 예금주 정보 확인
 * - 민감한 계좌 정보는 로그에 기록하지 않음
 *
 * 참고:
 * - 이 서비스는 상조팀장의 계좌 인증을 위해 사용됩니다.
 * - Iamport는 한국의 주요 결제 및 금융 API 제공업체입니다.
 * - 계좌 인증은 실제 은행 정보를 기반으로 하므로 높은 신뢰성을 제공합니다.
 */
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
