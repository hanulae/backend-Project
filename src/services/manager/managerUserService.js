import db from '../../models/index.js';
import * as managerUserDao from '../../daos/manager/managerUserDao.js';
import * as managerAddDocumentDao from '../../daos/admin/managerAddDocumentDao.js';
import * as managerPointHistoryDao from '../../daos/manager/managerPointHistoryDao.js';
import * as managerCashHistoryDao from '../../daos/manager/managerCashHistoryDao.js';
import dotenv from 'dotenv';

dotenv.config();

export const registerManager = async (params) => {
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

  const fileUrl = params.file.location;
  const fileName = params.file.originalname;

  const transaction = await db.sequelize.transaction();

  try {
    // 1. 상조팀장 생성
    const managerData = {
      managerEmail: params.managerEmail,
      managerPassword: params.managerPassword,
      managerName: params.managerName,
      managerPhoneNumber: params.managerPhoneNumber,
      managerBankName: params.managerBankName,
      managerBankNumber: params.managerBankNumber,
      managerBankHolder: params.managerName,
    };

    const result = await managerUserDao.insert(managerData, { transaction });

    // 2. 문서 정보 저장
    await managerAddDocumentDao.create(
      {
        managerId: result.managerId,
        managerDocName: fileName,
        managerDocPath: fileUrl,
      },
      { transaction },
    );

    // 3. 포인트 히스토리 초기화
    await managerPointHistoryDao.create(
      {
        managerId: result.managerId,
        transactionType: 'service_point',
        managerPointAmount: 0,
        managerPointBalanceAfter: 0,
        status: 'completed',
      },
      { transaction },
    );

    // 4. 캐시 히스토리 초기화
    await managerCashHistoryDao.create(
      {
        managerId: result.managerId,
        transactionType: 'service_cash',
        managerCashAmount: 0,
        managerCashBalanceAfter: 0,
        status: 'completed',
      },
      { transaction },
    );

    await transaction.commit();
    return {
      manager: result,
      fileUrl, // ✅ 추가된 리턴 값
    };
  } catch (error) {
    await transaction.rollback();

    // ✅ 실패 시 생성된 상조팀장 계정 삭제 (manual fallback)
    if (params.managerEmail) {
      await managerUserDao.deleteByEmail(params.managerEmail);
    }

    throw error;
  }
};

export const getMyProfile = async (managerId) => {
  try {
    const manager = await managerUserDao.findById(managerId);

    if (!manager) {
      throw new Error('상조팀장 정보를 찾을 수 없습니다.');
    }

    return manager.toSafeObject(); // 비밀번호 제외한 안전한 데이터만 전달
  } catch (error) {
    throw new Error('프로필 조회 실패: ' + error.message);
  }
};
