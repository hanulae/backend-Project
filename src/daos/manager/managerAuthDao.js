import db from '../../models/index.js';
import bcrypt from 'bcrypt';

export const findByEmail = async (email) => {
  try {
    return await db.Manager.findOne({ where: { managerEmail: email } });
  } catch (error) {
    throw new Error('🔴 findByEmail 오류:' + error.message);
  }
};

export const findByNameAndPhone = async (name, phoneNumber) => {
  try {
    return await db.Manager.findOne({
      where: {
        managerName: name,
        managerPhoneNumber: phoneNumber,
      },
    });
  } catch (error) {
    throw new Error('🔴 findByNameAndPhone 오류:' + error.message);
  }
};

export const findByPhone = async (managerPhoneNumber) => {
  try {
    return await db.Manager.findOne({
      where: { managerPhoneNumber: managerPhoneNumber },
    });
  } catch (error) {
    throw new Error('🔴 휴대폰으로 이메일 찾기 오류:' + error.message);
  }
};

export const findById = async (managerId) => {
  try {
    return await db.Manager.findByPk(managerId);
  } catch (error) {
    throw new Error('🔴 findById 오류:' + error.message);
  }
};

export const updatePassword = async (managerId, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await db.Manager.update({ managerPassword: hashedPassword }, { where: { managerId } });
  } catch (error) {
    throw new Error('비밀번호 업데이트 실패: ' + error.message);
  }
};

export const updatePhoneNumber = async (managerId, newPhoneNumber) => {
  try {
    return await db.Manager.update(
      { managerPhoneNumber: newPhoneNumber },
      { where: { managerId } },
    );
  } catch (error) {
    throw new Error('🔴 updatePhoneNumber 오류:' + error.message);
  }
};

export const updateBankInfo = async (
  managerId,
  managerBankName,
  managerBankNumber,
  managerBankHolder,
) => {
  try {
    return await db.Manager.update(
      {
        managerBankName,
        managerBankNumber,
        managerBankHolder,
      },
      { where: { managerId } },
    );
  } catch (error) {
    throw new Error('🔴 계좌 정보 업데이트 오류:' + error.message);
  }
};
