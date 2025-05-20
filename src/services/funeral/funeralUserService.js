import db from '../../models/index.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';
import * as funeralAddDocumentDao from '../../daos/admin/funeralAddDocumentDao.js';
import * as funeralPointHistoryDao from '../../daos/funeral/funeralPointHistoryDao.js';
import * as funeralCashHistoryDao from '../../daos/funeral/funeralCashHistoryDao.js';

export const registerFuneral = async (params) => {
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

  const fileUrl = params.file.location;
  const fileName = params.file.originalname;
  // 👉 트랜잭션 처리
  const transaction = await db.sequelize.transaction();

  try {
    // 1. 장례식장 회원 생성
    const funeralData = {
      funeralEmail: params.funeralEmail,
      funeralPassword: params.funeralPassword, // ❗ 평문 저장 (보안주의 필요)
      funeralName: params.funeralName,
      funeralPhoneNumber: params.funeralPhoneNumber,
      funeralBankName: params.funeralBankName,
      funeralBankNumber: params.funeralBankNumber,
      funeralBankHolder: params.funeralBankHolder,
    };

    const result = await funeralUserDao.insert(funeralData, transaction);

    // 2. 문서 정보 저장
    await funeralAddDocumentDao.create(
      {
        funeralId: result.funeralId,
        funeralDocName: fileName,
        funeralDocPath: fileUrl,
      },
      { transaction },
    );

    // 3. 포인트/캐시 초기값 생성
    await funeralPointHistoryDao.create(
      {
        funeralId: result.funeralId,
        transactionType: 'service_point',
        funeralPointAmount: 0,
        funeralPointBalanceAfter: 0,
        status: 'completed',
      },
      { transaction },
    );

    await funeralCashHistoryDao.create(
      {
        funeralId: result.funeralId,
        transactionType: 'service_cash',
        funeralCashAmount: 0,
        funeralCashBalanceAfter: 0,
        status: 'completed',
      },
      { transaction },
    );

    // 4. 커밋
    await transaction.commit();
    return {
      manager: result,
      fileUrl, // ✅ 추가된 리턴 값
    };
  } catch (error) {
    await transaction.rollback();
    throw new Error('회원가입 중 오류 발생: ' + error.message);
  }
};
