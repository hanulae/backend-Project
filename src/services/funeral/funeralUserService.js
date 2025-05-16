import bcrypt from 'bcrypt';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';
import * as pointDao from '../../daos/funeral/funeralPointHistoryDao.js';
import * as cashDao from '../../daos/funeral/funeralCashHistoryDao.js';

const SALT_ROUNDS = 10;

export const registerFuneral = async (params) => {
  console.log('params:', params);
  if (
    !params.funeralEmail ||
    !params.funeralPassword ||
    !params.funeralName ||
    !params.funeralPhoneNumber ||
    !params.funeralBankName ||
    !params.funeralBankNumber ||
    !params.funeralBankHolder ||
    !params.file
  ) {
    throw new Error('필수 정보가 누락되었습니다.');
  }

  const hashedPassword = await bcrypt.hash(params.funeralPassword, SALT_ROUNDS);
  const fileUrl = params.file.location;

  const funeralData = {
    funeralEmail: params.funeralEmail,
    funeralPassword: hashedPassword,
    funeralName: params.funeralName,
    funeralPhoneNumber: params.funeralPhoneNumber,
    funeralBankName: params.funeralBankName,
    funeralBankNumber: params.funeralBankNumber,
    funeralBankHolder: params.funeralBankHolder,
    fileUrl,
  };

  const createdFuneral = await funeralUserDao.insert(funeralData);

  await pointDao.createInitialPoint(createdFuneral.funeralId);
  await cashDao.createInitialCash(createdFuneral.funeralId);

  return createdFuneral;
};
