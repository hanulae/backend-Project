import db from '../../models/index.js';

export const findAllManagers = async () => {
  try {
    return await db.Manager.findAll();
  } catch (error) {
    throw new Error('상조팀장 조회 오류: ' + error.message);
  }
};

export const findAllFunerals = async () => {
  try {
    return await db.Funeral.findAll();
  } catch (error) {
    throw new Error('장례식장 조회 오류: ' + error.message);
  }
};

export const findById = async () => {
  try {
    // 첫 번째 관리자 계정 하나만 조회 (role이 'admin'인 계정)
    const result = await db.Admin.findOne({
      where: {
        role: 'admin',
      },
      order: [['createdAt', 'ASC']], // 가장 먼저 생성된 관리자
    });

    return result;
  } catch (error) {
    throw new Error('관리자 조회 오류: ' + error.message);
  }
};

export const findManagerById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId, {
      attributes: {
        exclude: ['managerPassword'], // 비밀번호 제외
      },
    });
  } catch (error) {
    throw new Error('상조팀장 조회 오류: ' + error.message);
  }
};

export const findFuneralById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId, {
      attributes: {
        exclude: ['funeralPassword'], // 비밀번호 제외
      },
    });
  } catch (error) {
    throw new Error('장례식장 조회 오류: ' + error.message);
  }
};
