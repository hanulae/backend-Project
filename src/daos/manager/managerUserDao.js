// src/dao/manager/managerUserDao.js
import Manager from '../../models/manager/manager.js'; // 모델 경로를 확인하세요

export const insert = async (managerData, options = {}) => {
  try {
    const newUser = await Manager.create(managerData, options); // ✅ 트랜잭션 적용
    return newUser;
  } catch (error) {
    console.error('회원가입 DAO 오류:', error.message);
    throw error;
  }
};
