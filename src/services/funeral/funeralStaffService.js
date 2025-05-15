import * as funeralStaffDao from '../../daos/funeral/funeralStaffDao.js';

export const createStaff = async (staffData) => {
  try {
    return await funeralStaffDao.create(staffData);
  } catch (error) {
    throw new Error('직원 생성 실패: ' + error.message);
  }
};

export const updateStaff = async (staffId, updateData) => {
  try {
    return await funeralStaffDao.update(staffId, updateData);
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
