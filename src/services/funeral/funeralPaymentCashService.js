/**
 * 장례식장 결제 캐시 서비스
 * - Iamport API를 사용하여 장례식장의 결제 처리를 관리하는 서비스입니다.
 * - 결제 준비, 웹훅 처리, 결제 검증, 토큰 발급 등의 기능을 제공합니다.
 * - 포트원(Iamport)과 연동하여 안전한 결제 처리를 보장합니다.
 * - 결제 정보와 캐시 히스토리를 연동하여 관리합니다.
 */
import * as funeralPaymentDao from '../../daos/funeral/funeralPaymentCashDao.js';
import axios from 'axios';

/**
 * Iamport API 액세스 토큰 발급
 *
 * 입력:
 * - 없음 (환경변수에서 API 키를 자동으로 가져옴)
 *
 * 동작:
 * 1) 환경변수에서 IAMPORT_API_KEY와 IAMPORT_API_SECRET을 가져옴
 * 2) Iamport API 엔드포인트로 POST 요청을 보내 토큰 발급
 * 3) 응답에서 access_token을 추출하여 반환
 *
 * API 통신:
 * - URL: https://api.iamport.kr/users/getToken
 * - Method: POST
 * - Body: { imp_key, imp_secret }
 *
 * 반환:
 * - string: Iamport API 액세스 토큰
 *
 * 예외:
 * - API 키 누락: 환경변수 설정 오류 시 axios 오류 발생
 * - 네트워크 오류: axios에서 발생한 오류를 그대로 전파
 * - 토큰 발급 실패: Iamport API 응답 오류 시 해당 오류 전파
 *
 * 보안:
 * - API 키는 환경변수에 저장되어 코드에 노출되지 않습니다.
 * - 토큰은 일정 시간 후 만료되므로 필요시 재발급이 필요합니다.
 */
export const getIamportToken = async () => {
  const res = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.IAMPORT_API_KEY,
    imp_secret: process.env.IAMPORT_API_SECRET,
  });

  return res.data.response.access_token;
};

/**
 * Iamport 결제 정보 조회
 *
 * 입력:
 * - imp_uid: string — Iamport에서 발급한 고유 결제 ID
 * - accessToken: string — Iamport API 액세스 토큰
 *
 * 동작:
 * 1) Iamport API 엔드포인트로 GET 요청을 보내 결제 정보 조회
 * 2) Authorization 헤더에 액세스 토큰을 포함하여 요청
 * 3) 응답에서 결제 상세 정보를 반환
 *
 * API 통신:
 * - URL: https://api.iamport.kr/payments/{imp_uid}
 * - Method: GET
 * - Headers: { Authorization: accessToken }
 *
 * 반환:
 * - Object: Iamport 결제 응답 데이터 (amount, status, buyer_name, merchant_uid 등)
 *
 * 예외:
 * - 잘못된 imp_uid: 존재하지 않는 결제 ID 시 404 오류
 * - 토큰 만료: 액세스 토큰이 만료된 경우 401 오류
 * - 네트워크 오류: axios에서 발생한 오류를 그대로 전파
 *
 * 응답 데이터:
 * - amount: 결제 금액
 * - status: 결제 상태 (paid, cancelled, failed 등)
 * - buyer_name: 구매자 이름
 * - merchant_uid: 가맹점 주문번호
 */
export const getPaymentData = async (imp_uid, accessToken) => {
  const res = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
    headers: { Authorization: accessToken },
  });

  return res.data.response;
};

/**
 * 결제 준비 및 대기 상태 생성
 *
 * 입력:
 * - merchantUid: string — 가맹점에서 생성한 고유 주문번호
 * - amount: number — 결제 금액
 * - funeralId: string — 장례식장 ID
 *
 * 동작:
 * 1) 입력 파라미터 유효성 검사 수행
 * 2) 결제 준비 정보를 데이터베이스에 pending 상태로 저장
 * 3) 저장된 결제 정보 반환
 *
 * 유효성 검사:
 * - funeralId: 필수값, 빈 값이면 안됨
 * - merchantUid: 필수값, 빈 값이면 안됨
 * - amount: 양수여야 함, 0 이하면 안됨
 *
 * 반환:
 * - Object: 생성된 결제 정보 (pending 상태)
 *
 * 예외:
 * - funeralId 누락: 'funeralId가 필요합니다.'
 * - merchantUid 누락: 'merchantUid가 필요합니다.'
 * - 잘못된 금액: '유효한 금액이 필요합니다.'
 * - DB 저장 실패: DAO에서 발생한 오류를 그대로 전파
 *
 * 참고:
 * - 이 단계에서는 실제 결제가 이루어지지 않고 준비 정보만 저장됩니다.
 * - 실제 결제는 프론트엔드에서 Iamport SDK를 통해 진행됩니다.
 */
export const preparePayment = async ({ merchantUid, amount, funeralId }) => {
  // 유효성 검사
  if (!funeralId) {
    throw new Error('funeralId가 필요합니다.');
  }
  if (!merchantUid) {
    throw new Error('merchantUid가 필요합니다.');
  }
  if (!amount || amount <= 0) {
    throw new Error('유효한 금액이 필요합니다.');
  }

  // 결제 준비 정보를 DB에 저장
  return await funeralPaymentDao.createPendingPayment({
    merchantUid,
    amount,
    funeralId,
  });
};

/**
 * Iamport 웹훅 처리 및 결제 완료 처리
 *
 * 입력:
 * - imp_uid: string — Iamport에서 발급한 고유 결제 ID
 * - merchant_uid: string — 가맹점에서 생성한 고유 주문번호
 *
 * 동작:
 * 1) merchant_uid로 기존 결제 정보 조회 및 존재 여부 확인
 * 2) Iamport API를 통해 실제 결제 정보 검증
 * 3) 금액 일치 여부 검증 (위조 방지)
 * 4) 결제 상태에 따라 결제 정보 업데이트 및 캐시 히스토리 생성
 *
 * 처리 과정:
 * - 기존 결제 정보 조회: merchant_uid 기준으로 DB에서 결제 정보 찾기
 * - Iamport 검증: imp_uid로 실제 결제 데이터 조회
 * - 금액 검증: DB 저장 금액과 실제 결제 금액 비교
 * - 상태별 처리: paid, cancelled 등 결제 상태에 따른 분기 처리
 *
 * 반환:
 * - Object: 업데이트된 결제 정보와 생성된 캐시 히스토리
 *
 * 예외:
 * - 결제 정보 없음: '결제 정보를 찾을 수 없습니다.'
 * - 금액 불일치: '금액 불일치로 위조 의심'
 * - API 오류: Iamport API 호출 실패 시 해당 오류 전파
 * - DB 처리 실패: DAO에서 발생한 오류를 그대로 전파
 *
 * 보안:
 * - 금액 검증을 통해 위조된 결제 요청을 방지합니다.
 * - Iamport의 공식 API를 통해서만 결제 정보를 검증합니다.
 */
export const processWebhook = async ({ imp_uid, merchant_uid }) => {
  // 1. merchant_uid로 기존 결제 정보 조회
  const existingPayment = await funeralPaymentDao.findByMerchantUid(merchant_uid);
  if (!existingPayment) {
    throw new Error('결제 정보를 찾을 수 없습니다.');
  }
  const funeralId = existingPayment.funeralId;

  // 2. 포트원에서 결제 정보 검증
  const accessToken = await getIamportToken();
  const paymentData = await getPaymentData(imp_uid, accessToken);

  // 3. 금액 검증
  if (paymentData.amount !== existingPayment.amount) {
    throw new Error('금액 불일치로 위조 의심');
  }

  // 4. 결제 정보 업데이트 및 캐시 히스토리 생성 (status에 따라 분기)
  return await funeralPaymentDao.updatePaymentAndCreateHistory({
    merchantUid: merchant_uid,
    impUid: imp_uid,
    status: paymentData.status, // paid, cancelled 등
    funeralId: funeralId,
    amount: paymentData.amount,
    buyerName: paymentData.buyer_name,
  });
};

/**
 * 결제 정보 종합 검증
 *
 * 입력:
 * - imp_uid: string — Iamport에서 발급한 고유 결제 ID
 * - merchant_uid: string — 가맹점에서 생성한 고유 주문번호
 * - amount: number — 예상 결제 금액
 *
 * 동작:
 * 1) Iamport API를 통해 실제 결제 정보 조회
 * 2) 금액 일치 여부 검증
 * 3) 결제 상태 검증 (paid 상태여야 함)
 * 4) merchant_uid 일치 여부 검증
 * 5) imp_uid 일치 여부 검증
 *
 * 검증 항목:
 * - 금액 검증: 예상 금액과 실제 결제 금액 비교
 * - 상태 검증: 결제가 성공적으로 완료된 상태인지 확인
 * - ID 검증: 요청 파라미터와 실제 결제 데이터의 ID 일치 여부
 *
 * 반환:
 * - Object: 검증된 Iamport 결제 데이터
 *
 * 예외:
 * - 금액 불일치: '금액 불일치로 위조 의심'
 * - 잘못된 결제 상태: '결제 상태가 올바르지 않습니다.'
 * - merchant_uid 불일치: 'merchant_uid 불일치로 위조 의심'
 * - imp_uid 불일치: 'imp_uid 불일치로 위조 의심'
 * - API 오류: Iamport API 호출 실패 시 해당 오류 전파
 *
 * 보안:
 * - 모든 주요 파라미터를 검증하여 위조된 결제 요청을 방지합니다.
 * - 결제 상태 검증을 통해 미완료된 결제를 차단합니다.
 *
 * 사용 시나리오:
 * - 프론트엔드에서 결제 완료 후 최종 검증 시 사용
 * - 관리자 페이지에서 결제 정보 확인 시 사용
 */
export const verifyPayment = async ({ imp_uid, merchant_uid, amount }) => {
  const accessToken = await getIamportToken();
  const paymentData = await getPaymentData(imp_uid, accessToken);

  if (paymentData.amount !== amount) {
    throw new Error('금액 불일치로 위조 의심');
  }

  if (paymentData.status !== 'paid') {
    throw new Error('결제 상태가 올바르지 않습니다.');
  }

  if (paymentData.merchant_uid !== merchant_uid) {
    throw new Error('merchant_uid 불일치로 위조 의심');
  }

  if (paymentData.imp_uid !== imp_uid) {
    throw new Error('imp_uid 불일치로 위조 의심');
  }
  return paymentData;
};
