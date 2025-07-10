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
    return await db.Admin.findOne();
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
