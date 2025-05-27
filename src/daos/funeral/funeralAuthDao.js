import db from '../../models/index.js';

export const findByEmail = async (email) => {
  try {
    return await db.Funeral.findOne({ where: { funeralEmail: email } });
  } catch (error) {
    throw new Error('🔴 findByEmail 오류:' + error);
  }
};

export const findById = async (funeralId) => {
  try {
    return await db.Funeral.findByPk(funeralId);
  } catch (error) {
    throw new Error('🔴 findById 오류:' + error.message);
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
    return await db.Manager.update(
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
      attributes: ['funeralEmail'],
    });
  } catch (error) {
    throw new Error(error);
  }
};
