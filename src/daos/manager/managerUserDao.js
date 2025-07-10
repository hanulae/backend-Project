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

export const findByUsername = async (managerUsername) => {
  try {
    return await db.Manager.findOne({
      where: {
        managerUsername,
      },
      paranoid: false, // 소프트 삭제된 레코드도 포함하여 조회하되, where 조건으로 필터링
    });
  } catch (error) {
    console.error('🔴 아이디 중복 확인 DAO 오류:', error.message);
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

export const findByPhone = async (managerPhoneNumber) => {
  try {
    return await db.Manager.findOne({ where: { managerPhoneNumber } });
  } catch (error) {
    console.error('🔴 휴대폰으로 아이디 찾기 DAO 오류:', error.message);
    throw error;
  }
};
