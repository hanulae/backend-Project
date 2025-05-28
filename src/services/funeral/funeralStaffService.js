import db from '../../models/index.js';
import * as funeralStaffDao from '../../daos/funeral/funeralStaffDao.js';
import * as funeralStaffPermissionDao from '../../daos/funeral/funeralStaffPermissionDao.js';

export const createStaff = async (params) => {
  const { funeralId, funeralStaffPhoneNumber, funeralStaffName, funeralStaffRole, permissions } =
    params;

  const transaction = await db.sequelize.transaction();

  try {
    // 1. 직원 생성
    const staff = await funeralStaffDao.create(
      {
        funeralId,
        funeralStaffPhoneNumber,
        funeralStaffName,
        funeralStaffRole,
      },
      { transaction },
    );

    // 2. 권한 생성 (permissions가 없으면 false로 초기화)
    await funeralStaffPermissionDao.create(
      {
        funeralStaffId: staff.funeralStaffId,
        manageStaff: permissions?.manageStaff ?? false,
        refundRequest: permissions?.refundRequest ?? false,
        dispatchDetail: permissions?.dispatchDetail ?? false,
        roomManagement: permissions?.roomManagement ?? false,
      },
      { transaction },
    );

    await transaction.commit();
    return staff;
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
  } = params;

  try {
    // 1. 직원 정보 수정
    const staff = await funeralStaffDao.update(funeralStaffId, {
      funeralStaffPhoneNumber,
      funeralStaffName,
      funeralStaffRole,
    });

    // 2. 권한 수정
    await funeralStaffPermissionDao.update(funeralStaffId, {
      manageStaff: permissions?.manageStaff ?? false,
      refundRequest: permissions?.refundRequest ?? false,
      dispatchDetail: permissions?.dispatchDetail ?? false,
      roomManagement: permissions?.roomManagement ?? false,
    });

    return staff;
  } catch (error) {
    throw new Error('직원 수정 실패: ' + error.message);
  }
};

export const deleteStaff = async (staffId) => {
  try {
    return await funeralStaffDao.remove(staffId);
  } catch (error) {
    throw new Error('직원 삭제 실패: ' + error.message);
  }
};

export const getStaffListByFuneral = async (funeralId) => {
  try {
    return await funeralStaffDao.findByFuneralId(funeralId);
  } catch (error) {
    throw new Error('직원 목록 조회 실패: ' + error.message);
  }
};
