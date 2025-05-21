import db from '../../models/index.js';

export const create = async (data) => {
  try {
    return await db.FuneralStaff.create(data);
  } catch (error) {
    throw new Error('직원 생성 오류:' + error);
  }
};

export const update = async (staffId, data) => {
  try {
    const [updatedCount, updatedRows] = await db.FuneralStaff.update(data, {
      where: { funeralStaffId: staffId },
      returning: true,
    });
    if (updatedCount === 0) throw new Error('해당 직원이 존재하지 않습니다.');
    return updatedRows[0];
  } catch (error) {
    throw new Error('직원 수정 오류:' + error);
  }
};

export const remove = async (staffId) => {
  try {
    const deleted = await db.FuneralStaff.destroy({ where: { funeralStaffId: staffId } });
    if (!deleted) throw new Error('삭제할 직원이 존재하지 않습니다.');
    return deleted;
  } catch (error) {
    throw new Error('직원 삭제 오류:' + error);
  }
};

export const findByFuneralId = async (funeralId) => {
  try {
    return await db.FuneralStaff.findAll({
      where: { funeralId },
      order: [['createdAt', 'DESC']],
    });
  } catch (error) {
    throw new Error('직원 목록 조회 오류:' + error);
  }
};
