import db from '../../models/index.js';

export const getFuneralList = async (funeralId) => {
  try {
    const funeralList = await db.FuneralList.findAll({
      where: {
        funeralId: funeralId,
      },
    });
    return funeralList;
  } catch (error) {
    throw new Error(`Failed to retrieve funeral list from database: ${error.message}`);
  }
};

export const updateFuneralById = async (funeralId, updateData) => {
  try {
    // Sequelize 모델이 FuneralList라고 가정합니다.
    const [updated] = await db.FuneralList.update(updateData, {
      where: { funeralId },
    });

    if (updated) {
      const updatedFuneral = await db.FuneralList.findOne({ where: { funeralId } });
      return updatedFuneral;
    }
    throw new Error('장례식장 목록 항목을 찾을 수 없습니다');
  } catch (error) {
    throw new Error(`장례식장 목록 항목 업데이트 실패: ${error.message}`);
  }
};
