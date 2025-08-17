/**
 * PortOne (구 Iamport) 결제 API 유틸리티
 * - 한국의 주요 결제 플랫폼인 PortOne과의 통신을 담당합니다.
 * - 결제 인증 토큰 발급, 결제 내역 조회 및 검증 기능을 제공합니다.
 * - 환경변수를 통한 API 키 관리로 보안을 강화합니다.
 * - axios를 사용하여 HTTP 통신을 처리하고, 결제 관련 API 엔드포인트와 연동합니다.
 * - 상조팀장의 결제 처리 및 장례식장의 결제 검증에 사용됩니다.
 */
// src/utils/portone.js
import axios from 'axios';
import dotenv from 'dotenv';

/**
 * 환경변수 설정
 * - .env 파일에서 PortOne API 관련 설정값을 로드
 * - PORTONE_API_KEY와 PORTONE_API_SECRET 환경변수 사용
 */
dotenv.config();

/**
 * PortOne API 인증 토큰 발급
 *
 * 입력:
 * - 없음 (환경변수에서 API 키를 자동으로 가져옴)
 *
 * 동작:
 * 1) 환경변수에서 PORTONE_API_KEY와 PORTONE_API_SECRET 조회
 * 2) PortOne API 서버에 토큰 발급 요청 전송
 * 3) 응답에서 액세스 토큰 추출 및 반환
 *
 * API 통신:
 * - URL: https://api.iamport.kr/users/getToken
 * - Method: POST
 * - Request Body: {
 *   imp_key: string — PortOne API 키,
 *   imp_secret: string — PortOne API 시크릿
 * }
 * - Content-Type: application/json
 *
 * 환경변수 설정:
 * - PORTONE_API_KEY: PortOne에서 발급받은 API 키
 * - PORTONE_API_SECRET: PortOne에서 발급받은 API 시크릿
 *
 * 응답 처리:
 * - response.data.response.access_token에서 액세스 토큰 추출
 * - 토큰은 일정 시간 후 자동 만료
 * - 만료된 토큰은 재발급이 필요
 *
 * 보안:
 * - API 키와 시크릿은 환경변수로 관리
 * - HTTPS를 통한 안전한 통신
 * - 토큰은 일정 시간 후 자동 만료
 *
 * 반환:
 * - string: PortOne API 액세스 토큰
 *
 * 예외:
 * - API 키 오류: PortOne API에서 발생한 인증 오류
 * - 네트워크 오류: axios에서 발생한 네트워크 오류 전파
 * - 환경변수 누락: process.env에서 undefined 값 참조 시 오류 발생
 * - 응답 형식 오류: 예상과 다른 응답 구조 시 오류 발생
 *
 * 사용 예시:
 * ```javascript
 * try {
 *   const token = await getPortOneToken();
 *   console.log('PortOne 토큰 발급 성공:', token);
 * } catch (error) {
 *   console.error('PortOne 토큰 발급 실패:', error.message);
 * }
 * ```
 *
 * 참고:
 * - 이 함수는 다른 PortOne API 호출 전에 반드시 호출되어야 합니다.
 * - 발급된 토큰은 일정 시간 후 만료되므로 필요시 재발급이 필요합니다.
 * - API 키와 시크릿은 PortOne 관리자 페이지에서 확인할 수 있습니다.
 * - 토큰 발급 실패 시 모든 PortOne API 호출이 불가능합니다.
 * - PortOne은 Iamport에서 서비스명을 변경한 것입니다.
 */
export const getPortOneToken = async () => {
  const response = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.PORTONE_API_KEY,
    imp_secret: process.env.PORTONE_API_SECRET,
  });
  return response.data.response.access_token;
};

/**
 * PortOne 결제 내역 조회 및 검증
 *
 * 입력:
 * - accessToken: string — PortOne API 액세스 토큰 (getPortOneToken()에서 발급)
 * - imp_uid: string — PortOne에서 발급한 고유 결제 식별자
 *
 * 동작:
 * 1) 발급받은 액세스 토큰을 Authorization 헤더에 포함
 * 2) PortOne API를 통해 특정 결제 건의 상세 정보 조회
 * 3) 결제 상태, 금액, 결제 방법 등 결제 정보 반환
 *
 * API 통신:
 * - URL: https://api.iamport.kr/payments/{imp_uid}
 * - Method: GET
 * - Headers: {
 *   Authorization: string — 액세스 토큰
 * }
 * - Path Parameter: imp_uid — 조회할 결제 건의 고유 ID
 *
 * 결제 정보 조회:
 * - 결제 상태 (status): paid, cancelled, failed 등
 * - 결제 금액 (amount): 실제 결제된 금액
 * - 결제 방법 (pay_method): card, vbank, phone 등
 * - 결제 시간 (paid_at): 결제 완료 시간
 * - 상점 주문번호 (merchant_uid): 가맹점에서 생성한 주문 ID
 * - 결제자 정보: 이름, 이메일, 전화번호 등
 *
 * 보안:
 * - Bearer 토큰을 통한 인증
 * - HTTPS를 통한 안전한 통신
 * - 결제 정보 접근 권한 검증
 *
 * 반환:
 * - Object: 결제 건의 상세 정보 (결제 상태, 금액, 방법, 시간 등)
 *
 * 예외:
 * - 토큰 오류: 잘못되거나 만료된 액세스 토큰
 * - 결제 건 없음: 존재하지 않는 imp_uid로 조회 시도
 * - 권한 부족: 해당 결제 건에 대한 조회 권한이 없는 경우
 * - API 오류: PortOne API에서 발생한 서버 오류
 * - 네트워크 오류: axios에서 발생한 네트워크 오류 전파
 *
 * 사용 예시:
 * ```javascript
 * try {
 *   const token = await getPortOneToken();
 *   const paymentInfo = await verifyPortOnePayment(token, 'imp_1234567890');
 *
 *   if (paymentInfo.status === 'paid') {
 *     console.log('결제 완료:', paymentInfo.amount, '원');
 *   } else {
 *     console.log('결제 상태:', paymentInfo.status);
 *   }
 * } catch (error) {
 *   console.error('결제 조회 실패:', error.message);
 * }
 * ```
 *
 * 결제 상태별 처리:
 * - paid: 결제 완료 — 서비스 제공 진행
 * - cancelled: 결제 취소 — 환불 처리 또는 재결제 안내
 * - failed: 결제 실패 — 오류 원인 확인 및 재시도 안내
 * - ready: 결제 대기 — 가상계좌 발급 대기 등
 *
 * 참고:
 * - 이 함수는 결제 완료 후 실제 결제 상태를 확인하는 데 사용됩니다.
 * - imp_uid는 결제 요청 시 PortOne에서 자동으로 생성되는 고유 ID입니다.
 * - 결제 검증은 중복 결제 방지와 결제 정보 정확성 확인을 위해 필수입니다.
 * - 결제 상태에 따라 적절한 비즈니스 로직 처리가 필요합니다.
 * - 결제 정보는 민감한 개인정보를 포함하므로 안전하게 관리해야 합니다.
 */
export const verifyPortOnePayment = async (accessToken, imp_uid) => {
  const response = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
    headers: { Authorization: accessToken },
  });
  return response.data.response;
};
