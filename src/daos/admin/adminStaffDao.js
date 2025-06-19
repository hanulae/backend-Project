import db from '../../models/index.js';

export const createAdminStaff = async (
  { adminId, email, password, name, adminStaffRole },
  options = {},
) => {
  return await db.AdminStaff.create(
    {
      adminId,
      adminStaffEmail: email,
      adminStaffPassword: password,
      adminStaffName: name,
      adminStaffRole: adminStaffRole, // ✅ 변경됨
    },
    options,
  );
};

export const createAdminStaffPermission = async (
  { adminStaffId, ...permissions },
  options = {},
) => {
  return await db.AdminStaffPermission.create({ adminStaffId, ...permissions }, options);
};

export const findAdminStaffById = async (adminStaffId) => {
  return await db.AdminStaff.findOne({
    where: { adminStaffId },
    include: [
      {
        model: db.AdminStaffPermission,
        as: 'permissions',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    ],
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
  });
};

export const findAllAdminStaffByAdminId = async (adminId) => {
  return await db.AdminStaff.findAll({
    where: { adminId },
    include: [
      {
        model: db.AdminStaffPermission,
        as: 'permissions',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    ],
    attributes: { exclude: ['password', 'createdAt', 'updatedAt'] },
    order: [['adminStaffId', 'ASC']],
  });
};

export const updateAdminStaff = async (adminStaffId, updatePayload) => {
  return await db.AdminStaff.update(updatePayload, { where: { adminStaffId } });
};

export const updateAdminStaffPermission = async (adminStaffId, permissions) => {
  return await db.AdminStaffPermission.update(permissions, { where: { adminStaffId } });
};

export const deleteAdminStaff = async (adminStaffId) => {
  return await db.AdminStaff.destroy({ where: { adminStaffId } });
};
