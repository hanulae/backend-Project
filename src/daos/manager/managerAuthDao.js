import db from '../../models/index.js';

export const findByEmail = async (email) => {
  return await db.Manager.findOne({ where: { managerEmail: email } });
};

// 이름과 번호로 이메일 조회
export const findByNameAndPhone = async (name, phoneNumber) => {
  return await db.Manager.findOne({
    where: {
      managerName: name,
      managerPhoneNumber: phoneNumber,
    },
  });
};

// 비밀번호 변경
export const updatePassword = async (managerId, hashedPassword) => {
  return await db.Manager.update({ managerPassword: hashedPassword }, { where: { managerId } });
};

// 전화번호 변경
export const updatePhoneNumber = async (managerId, newPhoneNumber) => {
  return await db.Manager.update({ managerPhoneNumber: newPhoneNumber }, { where: { managerId } });
};

// 계좌정보 변경
export const updateBankInfo = async (managerId, newBankName, newBankNumber) => {
  return await db.Manager.update(
    {
      managerBankName: newBankName,
      managerBankNumber: newBankNumber,
    },
    { where: { managerId } },
  );
};

export const approveManager = async (managerId) => {
  return await db.Manager.update(
    { isApproved: true, approvedAt: new Date() },
    { where: { managerId }, returning: true },
  );
};
