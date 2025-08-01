import * as funeralPaymentDao from '../../daos/funeral/funeralPaymentCashDao.js';
import axios from 'axios';

export const getIamportToken = async () => {
  const res = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: process.env.IAMPORT_API_KEY,
    imp_secret: process.env.IAMPORT_API_SECRET,
  });

  return res.data.response.access_token;
};

export const getPaymentData = async (imp_uid, accessToken) => {
  const res = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
    headers: { Authorization: accessToken },
  });

  return res.data.response;
};

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
