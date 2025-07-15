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
  console.log('🚀 ~ updateFuneralById ~ updateData:', updateData);
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

// 이미지 레코드 생성
export const bulkCreateImages = async (imageRecords) => {
  try {
    return await db.FuneralListImage.bulkCreate(imageRecords);
  } catch (error) {
    throw new Error(`이미지 레코드 생성 실패: ${error.message}`);
  }
};

// 이미지 리스트 조회
export const findImagesByFuneralListId = async (funeralListId) => {
  console.log('🚀 ~ findImagesByFuneralListId ~ funeralListId:', funeralListId);
  try {
    return await db.FuneralListImage.findAll({
      where: { funeralListId },
    });
  } catch (error) {
    throw new Error(`이미지 리스트 조회 실패: ${error.message}`);
  }
};

export const deleteImagesByFuneralListId = async (funeralListId) => {
  try {
    await db.FuneralListImage.destroy({
      where: { funeralListId },
    });
  } catch (error) {
    throw new Error(`이미지 삭제 실패: ${error.message}`);
  }
};
