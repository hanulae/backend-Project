import * as managerUserDao from '../../daos/manager/managerUserDao.js';
import * as managerPointHistoryDao from '../../daos/manager/managerPointHistoryDao.js';
import * as managerCashHistoryDao from '../../daos/manager/managerCashHistoryDao.js';
import dotenv from 'dotenv';

dotenv.config();

export const registerManager = async (params) => {
  //console.log("🚀 ~ registerManager ~ params:", params)
  // 필수 정보 확인

  if (
    !params.managerEmail ||
    !params.managerPassword ||
    !params.managerName ||
    !params.managerPhoneNumber ||
    !params.managerBankName ||
    !params.managerBankNumber ||
    !params.file
  ) {
    throw new Error('필수 정보가 누락되었습니다.');
  }

  //const hashedPassword = await bcrypt.hash(params.managerPassword, SALT_ROUNDS);

  const fileUrl = params.file.location; // S3에서 반환된 URL

  const managerData = {
    managerEmail: params.managerEmail,
    managerPassword: params.managerPassword,
    managerName: params.managerName,
    managerPhoneNumber: params.managerPhoneNumber,
    managerBankName: params.managerBankName,
    managerBankNumber: params.managerBankNumber,
    managerBankHolder: params.managerName,
    fileUrl: fileUrl,
  };

  const result = await managerUserDao.insert(managerData);

  // 2. 포인트 히스토리 초기값 생성
  await managerPointHistoryDao.create({
    managerId: result.managerId,
    transactionType: 'service_point',
    managerPointAmount: 0,
    managerPointBalanceAfter: 0,
    status: 'completed',
  });

  // 3. 캐시 히스토리 초기값 생성
  await managerCashHistoryDao.create({
    managerId: result.managerId,
    transactionType: 'service_cash',
    managerCashAmount: 0,
    managerCashBalanceAfter: 0,
    status: 'completed',
  });

  return result;
};
