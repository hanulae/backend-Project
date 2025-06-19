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
