import { Op } from 'sequelize';
import FuneralList from '../../models/funeral/funeralList.js';

const managerFuneralListDao = {
  /**
   * 장례식장 기본 리스트 조회
   * @param {*} offset
   * @param {*} limit
   * @returns
   */
  async getFuneralList(offset, limit) {
    return await FuneralList.findAndCountAll({
      offset,
      limit,
      attributes: ['funeralListId', 'funeralId', 'funeralName', 'funeralAddress'],
      order: [['createdAt', 'DESC']],
    });
  },

  /**
   * 장례식장 상세 정보 조회
   * @param {*} funeralListId
   * @returns
   */
  async getFuneralDetail(funeralListId) {
    return await FuneralList.findOne({
      where: { funeralListId: funeralListId },
    });
  },

  /**
   * 통합 검색 (검색어 + 지역)
   * @param {*} searchParams
   * @returns
   */
  async searchFuneralList({ keyword, sido, sigungu, offset, limit }) {
    const whereConditions = [];

    // 검색어 조건 (있을경우)
    if (keyword && keyword.trim()) {
      whereConditions.push({
        [Op.or]: [
          { funeralName: { [Op.iLike]: `%${keyword}%` } },
          { funeralSearchKeywords: { [Op.iLike]: `%${keyword}%` } },
          { funeralAddress: { [Op.iLike]: `%${keyword}%` } },
        ],
      });
    }

    // 지역 조건 (있을 경우)
    if (sido && sido.trim()) {
      whereConditions.push({ funeralRegion: { [Op.iLike]: `%${sido}%` } });
    }

    if (sigungu && sigungu.trim()) {
      whereConditions.push({ funeralCity: { [Op.iLike]: `%${sigungu}%` } });
    }

    // 조건이 없다면 일반 전체 조회
    const where = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    return await FuneralList.findAndCountAll({
      where,
      offset,
      limit,
      attributes: ['funeralListId', 'funeralId', 'funeralName', 'funeralAddress'],
      order: [['createdAt', 'DESC']],
    });
  },
};

export default managerFuneralListDao;
