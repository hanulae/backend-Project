import db from '../../models/index.js';

export const insert = async (funeralData) => {
  try {
    const newFuneral = await db.Funeral.create(funeralData);
    return newFuneral;
  } catch (error) {
    throw new Error('장례식장 회원가입 DAO 오류:' + error.message);
  }
};

export const findByUsername = async (funeralUsername) => {
  try {
    return await db.Funeral.findOne({ where: { funeralUsername } });
  } catch (error) {
    console.error('🔴 아이디 중복 확인 DAO 오류:', error.message);
    throw error;
  }
};

export const findById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId);
  } catch (error) {
    throw new Error('🔴 프로필 DAO 오류:' + error.message);
  }
};
