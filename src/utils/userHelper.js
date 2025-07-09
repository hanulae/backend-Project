import db from '../models/index.js';

/**
 * 사용자 모델 매핑
 */
export const USER_MODELS = {
  manager: db.Manager,
  funeral: db.Funeral,
  funeralStaff: db.FuneralStaff,
  admin: db.Admin,
};

/**
 * 사용자 ID와 타입으로 사용자 조회
 * @param {string} userId - 사용자 UUID
 * @param {string} userType - 사용자 타입 (manager|funeral|funeralStaff|admin)
 * @returns {Promise<Object|null>} 사용자 객체 또는 null
 */
export async function getUserById(userId, userType) {
  const Model = USER_MODELS[userType];
  if (!Model) {
    throw new Error(`Invalid user type: ${userType}`);
  }
  return await Model.findByPk(userId);
}

/**
 * 사용자 존재 여부 검증
 * @param {string} userId - 사용자 UUID
 * @param {string} userType - 사용자 타입 (manager|funeral|funeralStaff|admin)
 * @returns {Promise<Object>} 사용자 객체 (존재하지 않으면 에러 발생)
 */
export async function validateUserExists(userId, userType) {
  const user = await getUserById(userId, userType);
  if (!user) {
    throw new Error(`${userType} 사용자(${userId})가 존재하지 않습니다.`);
  }
  return user;
}

/**
 * 사용자 타입 유효성 검증
 * @param {string} userType - 사용자 타입
 * @returns {boolean} 유효한 사용자 타입인지 여부
 */
export function isValidUserType(userType) {
  return Object.keys(USER_MODELS).includes(userType);
}

/**
 * 사용자 정보 안전하게 반환 (비밀번호 제외)
 * @param {Object} user - 사용자 객체
 * @param {string} userType - 사용자 타입
 * @returns {Object} 안전한 사용자 객체
 */
export function getSafeUserData(user, userType) {
  if (!user) return null;

  // 각 사용자 타입별로 제외할 필드 정의
  const excludeFields = {
    manager: ['managerPassword'],
    funeral: ['funeralPassword'],
    funeralStaff: ['funeralStaffPassword'],
    admin: ['adminPassword'],
  };

  const fieldsToExclude = excludeFields[userType] || [];
  const safeData = { ...user.toJSON() };

  fieldsToExclude.forEach((field) => {
    delete safeData[field];
  });

  return safeData;
}

/**
 * 여러 사용자의 존재 여부를 한번에 검증
 * @param {Array} users - [{userId, userType}, ...] 형태의 배열
 * @returns {Promise<Array>} 검증된 사용자 객체들의 배열
 */
export async function validateMultipleUsers(users) {
  const validatedUsers = [];

  for (const { userId, userType } of users) {
    const user = await validateUserExists(userId, userType);
    validatedUsers.push(user);
  }

  return validatedUsers;
}

/**
 * 사용자 타입에 따른 기본 정보 조회 (이름, 이메일 등)
 * @param {string} userId - 사용자 UUID
 * @param {string} userType - 사용자 타입
 * @returns {Promise<Object>} 기본 정보만 포함된 객체
 */
export async function getUserBasicInfo(userId, userType) {
  const user = await getUserById(userId, userType);
  if (!user) return null;

  // 사용자 타입별 기본 정보 매핑
  const basicInfoMap = {
    manager: {
      id: user.managerId,
      name: user.managerName,
      username: user.managerUsername,
      phoneNumber: user.managerPhoneNum,
      type: 'manager',
    },
    funeral: {
      id: user.funeralId,
      name: user.funeralStaffName,
      username: user.funeralUsername,
      phoneNumber: user.funeralPhoneNum,
      type: 'funeral',
    },
    funeralStaff: {
      id: user.funeralStaffId,
      name: user.funeralStaffName,
      phoneNumber: user.funeralStaffPhoneNumber,
      role: user.funeralStaffRole,
      type: 'funeralStaff',
    },
    admin: {
      id: user.adminId,
      name: user.adminName,
      email: user.adminEmail,
      role: user.role,
      type: 'admin',
    },
  };

  return basicInfoMap[userType] || null;
}

/**
 * 사용자의 승인 상태 확인 (manager, funeral만 해당)
 * @param {string} userId - 사용자 UUID
 * @param {string} userType - 사용자 타입
 * @returns {Promise<boolean>} 승인 상태
 */
export async function isUserApproved(userId, userType) {
  if (!['manager', 'funeral'].includes(userType)) {
    return true; // 승인 프로세스가 없는 사용자 타입은 항상 true
  }

  const user = await getUserById(userId, userType);
  if (!user) return false;

  return user.isApproved === true;
}
