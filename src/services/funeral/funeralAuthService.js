import * as funeralAuthDao from '../../daos/funeral/funeralAuthDao.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';

export const login = async ({ funeralEmail, funeralPassword }) => {
  const funeral = await funeralAuthDao.findByEmail(funeralEmail);
  if (!funeral) {
    throw new Error('등록되지 않은 이메일입니다.');
  }

  if (!funeral.isApproved) {
    throw new Error('관리자 승인 전 계정입니다.');
  }

  // 평문 비밀번호 직접 비교
  if (funeral.managerPassword !== funeralPassword) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }

  const accessToken = generateToken({ funeralId: funeral.funeralId });
  const refreshToken = generateRefreshToken({ funeralId: funeral.funeralId });

  return {
    accessToken,
    refreshToken,
    funeral: funeral.toSafeObject(),
  };
};

export const updatePassword = async (funeralId, newPassword) => {
  try {
    return await funeralAuthDao.updatePassword(funeralId, newPassword);
  } catch (error) {
    throw new Error('비밀번호 변경 실패: ' + error.message);
  }
};

export const updatePhone = async (funeralId, newPhone) => {
  try {
    return await funeralAuthDao.updatePhone(funeralId, newPhone);
  } catch (error) {
    throw new Error('전화번호 변경 실패: ' + error.message);
  }
};

export const updateAccount = async (funeralId, bankName, bankNumber) => {
  try {
    return await funeralAuthDao.updateAccount(funeralId, bankName, bankNumber);
  } catch (error) {
    throw new Error('계좌번호 변경 실패: ' + error.message);
  }
};

export const findEmailByPhone = async (phoneNumber) => {
  try {
    const user = await funeralAuthDao.findByPhone(phoneNumber);
    if (!user) throw new Error('일치하는 이메일을 찾을 수 없습니다.');
    return user.funeralEmail;
  } catch (error) {
    console.error('이메일 찾기 오류:', error);
    throw error;
  }
};
