import * as funeralListDao from '../../daos/funeral/funeralListDao.js';

export const getFuneralList = async (funeralId) => {
  try {
    const funeralList = await funeralListDao.getFuneralList(funeralId);
    console.log('🚀 ~ getFuneralList ~ funeralList:', funeralList);
    const funeralListId = funeralList[0].funeralListId;
    console.log('🚀 ~ getFuneralList ~ funeralList:', funeralListId);

    const images = await funeralListDao.findImagesByFuneralListId(funeralListId);
    console.log('🚀 ~ getFuneralList ~ images:', images);
    return {
      funeralList,
      images,
    };
  } catch (error) {
    throw new Error(`Failed to retrieve funeral list: ${error.message}`);
  }
};

export const updateFuneralList = async (funeralId, updateData) => {
  try {
    const updatedFuneral = await funeralListDao.updateFuneralById(funeralId, updateData);

    // 기존 이미지 삭제
    await funeralListDao.deleteImagesByFuneralListId(updatedFuneral.funeralListId);

    // 새로운 이미지 저장
    if (updateData.funeralRoomFiles) {
      const imageRecords = updateData.funeralRoomFiles.map((url) => ({
        funeralListId: updatedFuneral.funeralListId,
        imageUrl: url,
      }));
      await funeralListDao.bulkCreateImages(imageRecords);
    }

    // 이미지 리스트 조회
    const images = await funeralListDao.findImagesByFuneralListId(updatedFuneral.funeralListId);

    return {
      updatedFuneral,
      images,
    };
  } catch (error) {
    throw new Error(`장례식장 목록 항목 업데이트 실패: ${error.message}`);
  }
};
