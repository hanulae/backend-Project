import funeralHallInfoDao from '../../dao/funeral/funeralHallInfoDao.js';
import logger from '../../config/logger.js';

const funeralInfoService = {
  async createFuneralHallInfo(roomInfo) {
    try {
      await funeralHallInfoDao.createFuneralHallInfo(roomInfo);

      return {
        success: true,
        message: '호실 정보 등록 완료',
      };
    } catch (error) {
      logger.error(error);
      throw error;
    }
  },

  /**
   * 장례식장에 등록된 호실 정보 불러오기
   */
  async getFuneralHallInfoList(funeralId) {
    try {
      const funeralHallInfoList = await funeralHallInfoDao.getFuneralHallInfoList(funeralId);

      return {
        success: true,
        data: funeralHallInfoList,
      };
    } catch (error) {
      logger.error(error);
      throw error;
    }
  },
};

export default funeralInfoService;
