import bcrypt from 'bcrypt';
import * as managerAuthDao from '../../daos/manager/managerAuthDao.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';

export const loginManager = async ({ managerEmail, managerPassword }) => {
  const manager = await managerAuthDao.findByEmail(managerEmail);
  if (!manager) throw new Error('존재하지 않는 이메일입니다.');

  if (!manager.isApproved) {
    throw new Error('관리자의 승인이 필요합니다.');
  }

  const isMatch = await bcrypt.compare(managerPassword, manager.managerPassword);
  if (!isMatch) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }

  const accessToken = generateToken({ managerId: manager.managerId });
  const refreshToken = generateRefreshToken({ managerId: manager.managerId });

  return {
    accessToken,
    refreshToken,
    manager: manager.toSafeObject(),
  };
};

// 로그아웃
export const logout = async (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.status(200).json({ message: '로그아웃 성공' });
};

// 비밀번호 변경
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const managerId = req.user.id;

  const manager = await managerAuthDao.findById(managerId);
  const isMatch = await bcrypt.compare(currentPassword, manager.managerPassword);
  if (!isMatch) return res.status(400).json({ message: '기존 비밀번호가 일치하지 않습니다.' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await managerAuthDao.updatePassword(managerId, hashed);
  res.json({ message: '비밀번호 변경 완료' });
};

// 휴대폰 번호 변경
export const updatePhoneNumber = async (req, res) => {
  const { phone } = req.body;
  const managerId = req.user.id;
  await managerAuthDao.updatePhoneNumber(managerId, phone);
  res.json({ message: '휴대폰 번호 변경 완료' });
};

// 계좌번호 변경
export const updateBankAccount = async (req, res) => {
  const { bankName, bankNumber } = req.body;
  const managerId = req.user.id;
  await managerAuthDao.updateBankInfo(managerId, bankName, bankNumber);
  res.json({ message: '계좌 정보 변경 완료' });
};

// 이메일 찾기
export const findEmail = async (req, res) => {
  const { name, phone } = req.body;
  const result = await managerAuthDao.findEmailByNameAndPhone(name, phone);
  if (result) {
    res.json({ email: result.managerEmail });
  } else {
    res.status(404).json({ message: '일치하는 정보가 없습니다.' });
  }
};

export const approveManager = async (managerId) => {
  return await managerAuthDao.approveManager(managerId);
};
