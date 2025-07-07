import db from '../../models/index.js';
import bcrypt from 'bcrypt';

export const findByEmail = async (email) => {
  try {
    return await db.Funeral.findOne({ where: { funeralEmail: email } });
  } catch (error) {
    throw new Error('🔴 findByEmail 오류:' + error);
  }
};

export const findManagerByUsername = async (funeralUsername) => {
  try {
    const funeral = await db.Funeral.findOne({ where: { funeralUsername } });
    return funeral;
  } catch (error) {
    throw new Error('데이터베이스 조회 중 오류가 발생했습니다.');
  }
};

export const findById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId);
  } catch (error) {
    throw new Error('🔴 findById 오류:' + error.message);
  }
};

export const findByUserInfo = async (funeralId) => {
  try {
    return await db.Funeral.findOne({ where: { funeralId } });
  } catch (error) {
    throw new Error('🔴 findByUserInfo 오류:' + error.message);
  }
};

export const updatePassword = async (funeralId, newPassword) => {
  try {
    const funeral = await db.Funeral.findByPk(funeralId);
    if (!funeral) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    funeral.funeralPassword = newPassword;
    await funeral.save();

    return funeral;
  } catch (error) {
    throw new Error(error);
  }
};

export const lostUpdatePassword = async (phoneNumber, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return await db.Funeral.update(
      { funeralPassword: hashedPassword },
      { where: { funeralPhoneNumber: phoneNumber } },
    );
  } catch (error) {
    throw new Error('비밀번호 업데이트 실패: ' + error.message);
  }
};

export const updatePhone = async (funeralId, newPhone) => {
  try {
    return await db.Funeral.update(
      { funeralPhoneNumber: newPhone },
      { where: { funeralId }, returning: true },
    );
  } catch (error) {
    throw new Error(error);
  }
};

export const updatePhoneNumber = async (funeralId, newPhoneNumber) => {
  try {
    return await db.Funeral.update(
      { funeralPhoneNumber: newPhoneNumber },
      { where: { funeralId } },
    );
  } catch (error) {
    throw new Error('🔴 updatePhoneNumber 오류:' + error.message);
  }
};

export const updateAccount = async (funeralId, bankName, bankNumber) => {
  try {
    return await db.Funeral.update(
      { funeralBankName: bankName, funeralBankNumber: bankNumber },
      { where: { funeralId }, returning: true },
    );
  } catch (error) {
    throw new Error(error);
  }
};

export const updateBankInfo = async (
  funeralId,
  funeralBankName,
  funeralBankNumber,
  funeralBacnkHolder,
) => {
  try {
    return await db.Funeral.update(
      {
        funeralBankName,
        funeralBankNumber,
        funeralBacnkHolder,
      },
      { where: { funeralId } },
    );
  } catch (error) {
    throw new Error('🔴 계좌 정보 업데이트 오류:' + error.message);
  }
};

export const findByPhone = async (funeralPhoneNumber) => {
  try {
    return await db.Funeral.findOne({
      where: { funeralPhoneNumber: funeralPhoneNumber },
      attributes: ['funeralUsername'],
    });
  } catch (error) {
    throw new Error('휴대폰으로 아이디 찾기 오류:' + error.message);
  }
};

export const getFuneralPhoneNumber = async (funeralId) => {
  return await db.Funeral.findOne({
    where: { funeralId },
    attributes: ['funeralPhoneNumber'],
  });
};

/**
 * 장례식장 포인트 및 캐쉬 조회
 * @param {*} funeralId
 * @param {*} transaction
 * @returns
 */
export const getFuneralPointAndCash = async (funeralId, options = {}) => {
  return await db.Funeral.findOne({
    where: { funeralId: funeralId },
    attributes: ['funeralPoint', 'funeralCash'],
    ...options,
  });
};

/**
 * 장례식장 포인트 및 캐쉬 업데이트
 * @param {*} funeralId
 * @param {*} point
 * @param {*} cash
 * @param {*} transaction
 */
export const updateFuneralPointAndCash = async (
  funeralId,
  updatePoint,
  updateCash,
  options = {},
) => {
  return await db.Funeral.update(
    { funeralPoint: updatePoint, funeralCash: updateCash },
    { where: { funeralId: funeralId }, ...options },
  );
};
