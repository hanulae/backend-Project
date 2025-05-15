import db from '../../models/index.js';
import logger from '../../config/logger.js'; // 로거가 없다면 console.error로 대체 가능

export const findByEmail = async (email) => {
  try {
    return await db.Funeral.findOne({ where: { funeralEmail: email } });
  } catch (error) {
    logger.error('🔴 findByEmail 오류:', error);
    throw error;
  }
};

export const updatePassword = async (funeralId, newPassword) => {
  try {
    return await db.Funeral.update(
      { funeralPassword: newPassword }, // 해싱 없이 평문 저장
      { where: { funeralId }, returning: true },
    );
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export const updatePhone = async (funeralId, newPhone) => {
  try {
    return await db.Funeral.update(
      { funeralPhoneNumber: newPhone },
      { where: { funeralId }, returning: true },
    );
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export const updateAccount = async (funeralId, bankName, bankNumber) => {
  try {
    return await db.Funeral.update(
      { funeralBankName: bankName, funeralBankNumber: bankNumber },
      { where: { funeralId }, returning: true },
    );
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export const findByPhone = async (phoneNumber) => {
  try {
    return await db.Funeral.findOne({
      where: { funeralPhoneNumber: phoneNumber },
      attributes: ['funeralEmail'],
    });
  } catch (error) {
    logger.error(error);
    throw error;
  }
};
