import db from '../../models/index.js';

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
  console.log('🚀 ~ updatePassword ~ newPassword:', newPassword);
  try {
    return await db.Manager.update({ managerPassword: newPassword }, { where: { managerId } });
  } catch (error) {
    throw new Error('🔴 updatePassword 오류:' + error.message);
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
