/**
 * 장례식장 계좌 인증 서비스
 * - Iamport API를 사용하여 은행 계좌의 실명 인증을 수행합니다.
 * - 계좌번호와 예금주명이 일치하는지 검증하여 계좌 소유권을 확인합니다.
 * - 현재 사용하지 않는 기능이지만, 향후 개발을 위해 보존되어 있습니다.
 */
import axios from 'axios';
import { getIamportToken } from '../../utils/iamportClient.js';

/**
 * 계좌 소유자 실명 인증
 *
 * 입력:
 * - bankCode: string — 은행 코드 (Iamport에서 제공하는 은행 식별자)
 * - bankNumber: string — 계좌번호
 * - name: string — 확인할 예금주명
 *
 * 동작:
 * 1) Iamport API 토큰 발급 (getIamportToken 호출)
 * 2) Iamport 실명 조회 API 호출 (GET /vbanks/holder)
 * 3) API 응답 코드 검증 (code === 0이 성공)
 * 4) 예금주명 일치 여부 확인
 * 5) 인증 성공 시 응답 데이터 반환
 *
 * API 통신:
 * - URL: https://api.iamport.kr/vbanks/holder
 * - Method: GET
 * - Headers: Authorization Bearer 토큰
 * - Query Parameters: bank_code, bank_num
 *
 * 반환:
 * - Object: Iamport API 응답 데이터 (예: { bank_holder: '홍길동' })
 *
 * 예외:
 * - Iamport API 오류: '계좌 인증 실패: {오류메시지}' 형태로 Error throw
 * - 예금주명 불일치: '예금주가 다릅니다.' Error throw
 * - 네트워크/토큰 오류: axios 또는 getIamportToken에서 발생한 오류를 그대로 전파
 *
 * 보안/주의사항:
 * - Iamport API 토큰은 Bearer 형식으로 전송해야 합니다.
 * - 계좌번호와 예금주명은 민감한 정보이므로 로깅 시 주의가 필요합니다.
 * - API 호출 실패 시 사용자에게 노출되는 오류 메시지를 적절히 필터링하는 것을 권장합니다.
 */
export const verifyAccountOwner = async ({ bankCode, bankNumber, name }) => {
  const token = await getIamportToken();

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

  // 4. 예금주 이름 확인
  const bankHolder = data.response.bank_holder;
  if (bankHolder !== name) {
    throw new Error('예금주가 다릅니다.');
  }

  // 5. 예금주 이름 반환
  return data.response; // ex: { bank_holder: '홍길동' }
};
