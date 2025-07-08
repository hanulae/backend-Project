import db from '../../models/index.js';
import * as funeralStaffDao from '../../daos/funeral/funeralStaffDao.js';
import * as funeralStaffPermissionDao from '../../daos/funeral/funeralStaffPermissionDao.js';
import { generateToken, generateRefreshToken } from '../../utils/jwt.js';

export const createStaff = async (params) => {
  const transaction = await db.sequelize.transaction();

  try {
    // 1. 직원 생성
    const staff = await funeralStaffDao.create(
      {
        funeralId: params.funeralId,
        funeralStaffPhoneNumber: params.funeralStaffPhoneNumber,
        funeralStaffName: params.funeralStaffName,
        funeralStaffRole: params.funeralStaffRole,
        funeralStaffPassword: params.funeralStaffPassword,
        funeralMainPhoneNumber: params.funeralMainPhoneNumber,
      },
      { transaction },
    );

    // 2. 권한 생성 (permissions가 없으면 false로 초기화)
    const staffPermissions = await funeralStaffPermissionDao.create(
      {
        funeralStaffId: staff.funeralStaffId,
        roomManagement: params.permissions?.room_management ?? false,
        infoEdit: params.permissions?.info_edit ?? false,
        dispatchHistory: params.permissions?.dispatch_history ?? false,
        dispatchPending: params.permissions?.dispatch_pending ?? false,
        estimateHistory: params.permissions?.estimate_history ?? false,
        appSettings: params.permissions?.app_settings ?? false,
        pointHistory: params.permissions?.point_history ?? false,
      },
      { transaction },
    );

    await transaction.commit();
    return { staff, permissions: staffPermissions };
  } catch (error) {
    await transaction.rollback();
    throw new Error('직원 생성 실패: ' + error.message);
  }
};

export const updateStaff = async (params) => {
  const {
    funeralStaffId,
    funeralStaffPhoneNumber,
    funeralStaffName,
    funeralStaffRole,
    permissions,
    funeralStaffPassword,
    funeralMainPhoneNumber,
  } = params;

  try {
    // 1. 직원 정보 수정
    const staff = await funeralStaffDao.update(funeralStaffId, {
      funeralStaffPhoneNumber,
      funeralStaffName,
      funeralStaffRole,
      funeralStaffPassword,
      funeralMainPhoneNumber,
    });

    // 2. 권한 수정
    const staffPermissions = await funeralStaffPermissionDao.update(funeralStaffId, {
      roomManagement: permissions?.room_management ?? false,
      infoEdit: permissions?.info_edit ?? false,
      dispatchHistory: permissions?.dispatch_history ?? false,
      dispatchPending: permissions?.dispatch_pending ?? false,
      estimateHistory: permissions?.estimate_history ?? false,
      appSettings: permissions?.app_settings ?? false,
      pointHistory: permissions?.point_history ?? false,
    });

    return { staff, permissions: staffPermissions };
  } catch (error) {
    throw new Error('직원 수정 실패: ' + error.message);
  }
};

export const deleteStaff = async (funeralStaffId) => {
  try {
    return await funeralStaffDao.remove(funeralStaffId);
  } catch (error) {
    throw new Error('직원 삭제 실패: ' + error.message);
  }
};

export const getStaffListByFuneral = async (funeralId) => {
  try {
    const staffList = await funeralStaffDao.findByFuneralStaffWithPermissions(funeralId);
    return staffList;
  } catch (error) {
    throw new Error('직원 목록 조회 실패: ' + error.message);
  }
};

export async function getStaffByPhoneNumber(phoneNumber, funeralId) {
  try {
    const staff = await funeralStaffDao.getStaffByPhoneNumberAndFuneralId(phoneNumber, funeralId);
    return staff;
  } catch (error) {
    throw new Error(`직원 조회 서비스 실패: ${error.message}`);
  }
}

export async function loginStaff({ funeralStaffPhoneNumber, funeralStaffPassword }) {
  const staff = await funeralStaffDao.findByPhoneNumber(funeralStaffPhoneNumber);

  if (!staff || staff.funeralStaffPassword !== funeralStaffPassword) {
    return null; // 로그인 실패
  }

  // 토큰 생성
  const accessToken = generateToken({
    funeralId: staff.funeralId,
    funeralStaffId: staff.funeralStaffId,
  });

  const refreshToken = generateRefreshToken({
    funeralId: staff.funeralId,
    funeralStaffId: staff.funeralStaffId,
  });

  // 직원 권한 가져오기
  const permissions = await getStaffPermissions(staff.funeralStaffId);

  return {
    accessToken,
    refreshToken,
    staff: staff.toSafeObject ? staff.toSafeObject() : staff,
    permissions,
  };
}

export async function getStaffPermissions(staffId) {
  // 직원 ID로 권한을 가져오는 DAO 함수가 있다고 가정합니다
  return await funeralStaffPermissionDao.getPermissionsByStaffId(staffId);
}
