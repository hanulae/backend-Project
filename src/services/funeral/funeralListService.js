import * as funeralListDao from '../../daos/funeral/funeralListDao.js';

export const getFuneralList = async (funeralId) => {
  try {
    const funeralList = await funeralListDao.getFuneralList(funeralId);
    return funeralList;
  } catch (error) {
    throw new Error(`Failed to retrieve funeral list: ${error.message}`);
  }
};

export const updateFuneralList = async (funeralId, updateData) => {
  try {
    const updatedFuneral = await funeralListDao.updateFuneralById(funeralId, updateData);
    return updatedFuneral;
  } catch (error) {
    throw new Error(`장례식장 목록 항목 업데이트 실패: ${error.message}`);
  }
};
