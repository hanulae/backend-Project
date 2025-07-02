import db from '../../models/index.js';
import * as funeralUserDao from '../../daos/funeral/funeralUserDao.js';
import * as funeralAddDocumentDao from '../../daos/admin/funeralAddDocumentDao.js';
import * as funeralPointHistoryDao from '../../daos/funeral/funeralPointHistoryDao.js';
//import * as funeralCashHistoryDao from '../../daos/funeral/funeralCashHistoryDao.js';

export const registerFuneral = async (params) => {
  if (
    !params.funeralEmail ||
    !params.funeralPassword ||
    !params.funeralName ||
    !params.funeralPhoneNumber ||
    !params.funeralBankName ||
    !params.funeralBankNumber ||
    !params.funeralBankHolder ||
    !params.files ||
    !Array.isArray(params.files) ||
    params.files.length === 0
  ) {
    throw new Error('필수 정보가 누락되었습니다.');
  }

  const transaction = await db.sequelize.transaction();

  try {
    const funeralData = {
      funeralEmail: params.funeralEmail,
      funeralPassword: params.funeralPassword,
      funeralName: params.funeralName,
      funeralPhoneNumber: params.funeralPhoneNumber,
      funeralBankName: params.funeralBankName,
      funeralBankNumber: params.funeralBankNumber,
      funeralBankHolder: params.funeralBankHolder,
    };

    const result = await funeralUserDao.insert(funeralData, transaction);

    // ✅ 여러 파일 반복 저장
    for (const file of params.files) {
      await funeralAddDocumentDao.create(
        {
          funeralId: result.funeralId,
          funeralDocName: file.originalname,
          funeralDocPath: file.location,
        },
        { transaction },
      );
    }

    await funeralPointHistoryDao.create(
      {
        funeralId: result.funeralId,
        transactionType: 'service_point',
        funeralPointAmount: 50000,
        funeralPointBalanceAfter: 50000,
        status: 'completed',
      },
      { transaction },
    );

    await db.Funeral.update(
      {
        funeralPoint: 50000,
        funeralCash: 0,
      },
      { where: { funeralId: result.funeralId }, transaction },
    );

    await transaction.commit();

    return {
      funeral: result,
      fileCount: params.files.length,
    };
  } catch (error) {
    await transaction.rollback();
    throw new Error('회원가입 중 오류 발생: ' + error.message);
  }
};

export const isUsernameAvailable = async (funeralUsername) => {
  try {
    const funeral = await funeralUserDao.findByUsername(funeralUsername);
    return !funeral; // Return true if no manager is found, meaning the username is available
  } catch (error) {
    console.error('아이디 중복 확인 서비스 오류:', error.message);
    throw error;
  }
};

export const getMyProfile = async (funeralId) => {
  try {
    const funeral = await funeralUserDao.findById(funeralId);

    if (!funeral) {
      throw new Error('상조팀장 정보를 찾을 수 없습니다.');
    }

    return funeral.toSafeObject(); // 비밀번호 제외한 안전한 데이터만 전달
  } catch (error) {
    throw new Error('프로필 조회 실패: ' + error.message);
  }
};
