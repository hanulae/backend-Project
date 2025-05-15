// src/dao/manager/managerUserDao.js
import Manager from '../../models/manager/manager.js'; // 모델 경로를 확인하세요

export const insert = async (managerData) => {
  try {
    const newUser = await Manager.create(managerData); // ✅ 이름 변경됨
    return newUser;
  } catch (error) {
    console.error('회원가입 DAO 오류:', error.message);
    throw error;
  }
};
