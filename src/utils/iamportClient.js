/**
 * Iamport (PortOne) API 클라이언트 유틸리티
 * - 한국의 주요 결제 및 금융 API 제공업체인 Iamport와의 통신을 담당합니다.
 * - API 액세스 토큰 발급, 은행 계좌 예금주 검증 등의 기능을 제공합니다.
 * - 환경변수를 통한 API 키 관리로 보안을 강화합니다.
 * - axios를 사용하여 HTTP 통신을 처리하고, 적절한 오류 처리를 제공합니다.
 * - 은행 계좌 인증을 통한 사용자 신원 확인 및 보안 강화를 지원합니다.
 */
import axios from 'axios';
//import path from 'path';
import dotenv from 'dotenv';
//dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

/**
 * Iamport API 액세스 토큰 발급
 *
 * 입력:
 * - 없음 (환경변수에서 API 키를 자동으로 가져옴)
 *
 * 동작:
 * 1) 환경변수에서 IAMPORT_API_KEY와 IAMPORT_API_SECRET 조회
 * 2) Iamport API 서버에 토큰 발급 요청 전송
 * 3) 응답 코드 확인 및 토큰 추출
 * 4) 발급된 액세스 토큰 반환
 *
 * API 통신:
 * - URL: https://api.iamport.kr/users/getToken
 * - Method: POST
 * - Request Body: {
 *   imp_key: string — Iamport API 키,
 *   imp_secret: string — Iamport API 시크릿
 * }
 * - Content-Type: application/json
 *
 * 환경변수 설정:
 * - IAMPORT_API_KEY: Iamport에서 발급받은 API 키
 * - IAMPORT_API_SECRET: Iamport에서 발급받은 API 시크릿
 * - NODE_ENV에 따라 적절한 .env 파일 로드
 *
 * 응답 처리:
 * - data.code가 0인 경우: 성공 응답
 * - data.response.access_token에서 액세스 토큰 추출
 * - data.code가 0이 아닌 경우: 오류 발생
 *
 * 보안:
 * - API 키와 시크릿은 환경변수로 관리
 * - HTTPS를 통한 안전한 통신
 * - 토큰은 일정 시간 후 자동 만료
 *
 * 반환:
 * - string: Iamport API 액세스 토큰
 *
 * 예외:
 * - API 키 오류: '아임포트 토큰 발급 실패: {API 오류 메시지}'
 * - 네트워크 오류: axios에서 발생한 네트워크 오류 전파
 * - 환경변수 누락: process.env에서 undefined 값 참조 시 오류 발생
 *
 * 참고:
 * - 이 함수는 다른 Iamport API 호출 전에 반드시 호출되어야 합니다.
 * - 발급된 토큰은 일정 시간 후 만료되므로 필요시 재발급이 필요합니다.
 * - API 키와 시크릿은 Iamport 관리자 페이지에서 확인할 수 있습니다.
 * - 토큰 발급 실패 시 모든 Iamport API 호출이 불가능합니다.
 */
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

/**
 * 은행 계좌 예금주 실명 검증
 *
 * 입력:
 * - bankCode: string — 은행 코드 (Iamport에서 제공하는 은행 식별 코드)
 * - bankNumber: string — 계좌번호 (하이픈 제외한 순수 숫자)
 *
 * 동작:
 * 1) getIamportToken()을 통해 API 액세스 토큰 발급
 * 2) 발급된 토큰을 Authorization 헤더에 포함하여 계좌 검증 요청
 * 3) Iamport API를 통해 계좌번호와 은행코드로 실제 예금주명 조회
 * 4) API 응답에서 예금주 정보 추출 및 반환
 *
 * API 통신:
 * - URL: https://api.iamport.kr/vbanks/holder
 * - Method: POST
 * - Request Body: {
 *   bank_code: string — 은행 코드,
 *   bank_num: string — 계좌번호
 * }
 * - Headers: {
 *   Authorization: Bearer {access_token}
 * }
 * - Content-Type: application/json
 *
 * 검증 과정:
 * - 은행 코드와 계좌번호를 Iamport API에 전송
 * - Iamport가 실제 은행 시스템과 연동하여 예금주 정보 조회
 * - 조회된 예금주명과 사용자 입력 정보 비교 가능
 *
 * 응답 데이터:
 * - data.code: 응답 코드 (0: 성공, 기타: 실패)
 * - data.response: 응답 데이터
 *   - bank_holder: string — 실제 예금주명
 * - data.message: 오류 메시지 (실패 시)
 *
 * 보안:
 * - Bearer 토큰을 통한 인증
 * - HTTPS를 통한 안전한 통신
 * - 실제 은행 시스템과의 연동으로 높은 신뢰성
 *
 * 반환:
 * - Object: { bank_holder: string } — 실제 예금주명이 포함된 응답 객체
 *
 * 예외:
 * - 토큰 발급 실패: getIamportToken에서 발생한 오류 전파
 * - API 통신 실패: axios에서 발생한 네트워크 오류 전파
 * - API 응답 오류: '계좌 인증 실패: {API 오류 메시지}' 형태로 Error throw
 * - 계좌 정보 오류: 잘못된 은행코드나 계좌번호로 인한 검증 실패
 *
 * 사용 예시:
 * ```javascript
 * try {
 *   const accountInfo = await verifyAccountOwner({
 *     bankCode: '001', // 신한은행
 *     bankNumber: '1234567890'
 *   });
 *   console.log('예금주:', accountInfo.bank_holder);
 * } catch (error) {
 *   console.error('계좌 인증 실패:', error.message);
 * }
 * ```
 *
 * 참고:
 * - 이 함수는 상조팀장의 은행 계좌 인증에 사용됩니다.
 * - 은행 코드는 Iamport에서 제공하는 표준 코드를 사용해야 합니다.
 * - 계좌번호는 하이픈을 제외한 순수 숫자만 입력해야 합니다.
 * - 실제 은행 정보를 기반으로 하므로 높은 신뢰성을 제공합니다.
 * - API 호출 횟수에 따른 요금이 발생할 수 있습니다.
 */
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
