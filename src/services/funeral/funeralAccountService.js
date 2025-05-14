import axios from 'axios';
import { getIamportToken } from '../../utils/iamportClient.js';

export const verifyAccountOwner = async ({ bankCode, bankNumber }) => {
  const token = await getIamportToken();

  const response = await axios.post(
    'https://api.iamport.kr/vbanks/holder',
    {
      bank_code: bankCode,
      bank_num: bankNumber,
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (response.data.code !== 0) {
    throw new Error(response.data.message);
  }

  return response.data.response;
};
