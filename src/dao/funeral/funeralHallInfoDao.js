import funeralHallInfo from '../../models/funeral/funeralHallInfo.js';

const funeralHallInfoDao = {
  /**
   * 장례식장 호실 정보 추가 생성
   */
  async createFuneralHallInfo(roomInfo) {
    const result = await funeralHallInfo.create(roomInfo);

    return result;
  },

  /**
   * 장례식장 등록한 호실 정보 리스트 불러오기
   */
  async getFuneralHallInfoList(funeralId) {
    const result = await funeralHallInfo.findAll({
      where: {
        funeralId: funeralId,
      },
      attributes: [
        'funeralHallId',
        'funeralHallName',
        'funeralHallSize',
        'funeralHallNumberOfMourners',
        'funeralHallPrice',
        'funeralHallDetailPrice',
      ],
    });

    return result;
  },

  // 수정

  // 삭제
};

export default funeralHallInfoDao;
