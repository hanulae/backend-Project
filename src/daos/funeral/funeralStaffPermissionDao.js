import db from '../../models/index.js';

export const create = async (data, options = {}) => {
  try {
    return await db.FuneralStaffPermission.create(data, options);
  } catch (error) {
    throw new Error('직원 권한 생성 오류: ' + error.message);
  }
};

export const update = async (funeralStaffId, data) => {
  try {
    const existing = await db.FuneralStaffPermission.findOne({ where: { funeralStaffId } });

    if (existing) {
      return await db.FuneralStaffPermission.update(data, { where: { funeralStaffId } });
    } else {
      return await db.FuneralStaffPermission.create({ funeralStaffId, ...data });
    }
  } catch (error) {
    throw new Error('직원 권한 수정 오류: ' + error.message);
  }
};
