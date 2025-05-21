// src/dao/manager/managerUserDao.js
import db from '../../models/index.js';

export const insert = async (managerData, options = {}) => {
  try {
    const newUser = await db.Manager.create(managerData, options); // ✅ 트랜잭션 적용
    return newUser;
  } catch (error) {
    console.error('회원가입 DAO 오류:', error.message);
    throw error;
  }
};

export const findById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    console.error('🔴 프로필 DAO 오류:', error.message);
    throw error;
  }
};
