import db from '../../models/index.js';

export const insert = async (funeralData) => {
  try {
    const newFuneral = await db.Funeral.create(funeralData);
    return newFuneral;
  } catch (error) {
    console.error('장례식장 회원가입 DAO 오류:', error.message);
    throw error;
  }
};
