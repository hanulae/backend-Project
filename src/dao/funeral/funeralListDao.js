import FuneralList from '../../models/funeral/funeralList.js';

const funeralListDao = {
  /**
   * 장례식장 리스트 ID를 통한 장례식장 ID 조회
   */
  async getFuneralIdByFuneralListId(funeralListId, options = {}) {
    const result = await FuneralList.findAll({
      where: { funeralListId: funeralListId },
      attributes: ['funeralListId', 'funeralId'],
      ...options,
    });
    return result;
  },
};

export default funeralListDao;
