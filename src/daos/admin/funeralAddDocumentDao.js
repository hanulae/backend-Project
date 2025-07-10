import db from '../../models/index.js';

export const create = async (data, options = {}) => {
  try {
    return await db.FuneralAddDocument.create(data, options); // 트랜잭션 포함
  } catch (error) {
    console.error('📄 문서 업로드 DAO 오류:', error.message);
    throw error;
  }
};

export const findByFuneralId = async (funeralId) => {
  try {
    return await db.FuneralAddDocument.findAll({ where: { funeralId } });
  } catch (error) {
    console.error('📄 문서 업로드 DAO 오류:', error.message);
    throw error;
  }
};

export const findAllByFuneralId = async (funeralId) => {
  try {
    return await db.FuneralAddDocument.findAll({ where: { funeralId } });
  } catch (error) {
    console.error('📄 문서 업로드 DAO 오류:', error.message);
    throw error;
  }
};
