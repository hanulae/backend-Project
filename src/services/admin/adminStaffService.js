import * as adminStaffDao from '../../daos/admin/adminStaffDao.js';
import db from '../../models/index.js';

export const createAdminStaff = async ({
  adminId,
  email,
  password,
  name,
  adminStaffRole,
  permissions,
}) => {
  const transaction = await db.sequelize.transaction();

  try {
    const staff = await adminStaffDao.createAdminStaff(
      { adminId, email, password, name, adminStaffRole },
      { transaction },
    );

    const defaultPermissions = {
      canManageUsers: false,
      canManageRefunds: false,
      canViewDashboard: false,
    };

    await adminStaffDao.createAdminStaffPermission(
      {
        adminStaffId: staff.adminStaffId,
        ...(permissions || defaultPermissions),
      },
      { transaction },
    );

    await transaction.commit();
    return staff;
  } catch (err) {
    await transaction.rollback();
    throw new Error('관리자 직원 생성 중 오류 발생: ' + err.message);
  }
};

export const getAdminStaffById = async (adminStaffId) => {
  const staff = await adminStaffDao.findAdminStaffById(adminStaffId);

  if (!staff) {
    throw new Error('해당 관리자 직원을 찾을 수 없습니다.');
  }

  return staff;
};

export const getAllAdminStaff = async (adminId) => {
  return await adminStaffDao.findAllAdminStaffByAdminId(adminId);
};

export const updateAdminStaff = async (adminStaffId, updateData) => {
  const { email, password, name, permissions } = updateData;

  const updatePayload = { email, name };
  if (password) updatePayload.password = password;

  await adminStaffDao.updateAdminStaff(adminStaffId, updatePayload);

  if (permissions) {
    await adminStaffDao.updateAdminStaffPermission(adminStaffId, permissions);
  }

  return true;
};

export const deleteAdminStaff = async (adminStaffId) => {
  await adminStaffDao.deleteAdminStaff(adminStaffId);
};
