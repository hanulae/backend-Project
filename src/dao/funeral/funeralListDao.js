import FuneralList from '../../models/funeral/funeralList.js';
import { sequelize } from '../../config/database.js';

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

  /**
   * 장례식장 정보 업데이트 함수
   */
  async updateFuneralList(funeralId, updateData, options = {}) {
    const result = await FuneralList.update(updateData, {
      where: { funeralId: funeralId },
      ...options,
    });
    return result;
  },

  /**
   * 장례식장 호실 갯수 증가
   */
  async incrementFuneralTotalRooms(funeralId, increment = 1, options = {}) {
    return this.updateFuneralList(funeralId, {
      funeralTotalRooms: sequelize.literal(`funeral_total_rooms + ${increment}`),
      ...options,
    });
  },

  /**
   * 장례식장 호실 갯수 감소
   */
  async decrementFuneralTotalRooms(funeralId, decrement = 1, options = {}) {
    return this.updateFuneralList(funeralId, {
      funeralTotalRooms: sequelize.literal(`funeral_total_rooms - ${decrement}`),
      ...options,
    });
  },
};

export default funeralListDao;
