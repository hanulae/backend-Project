import { Op } from 'sequelize';
import FuneralList from '../../models/funeral/funeralList.js';
import { sequelize } from '../../config/database.js';

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
      order: [['funeralId', 'ASC']],
    });
  },

  /**
   * 등록된 장례식장의 시/도 목록 조회 (중복 제거 + 서울 우선 정렬)
   * @returns {Promise<Array<string>>} 중복 제거된 시/도 목록 배열
   */
  async getRegions() {
    // DISTINCT를 사용하여 중복 제거된 시/도 목록 조회
    const regions = await FuneralList.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('funeral_region')), 'region']],
      where: {
        funeralRegion: { [Op.ne]: null },
      },
      raw: true,
    });

    const regionNames = regions.map((item) => item.region);

    // JavaScript에서 정렬: 서울을 맨 앞으로, 나머지는 가나다순
    const sortedRegions = regionNames.sort((a, b) => {
      if (a === '서울') return -1;
      if (b === '서울') return 1;
      return a.localeCompare(b, 'ko');
    });

    return sortedRegions;
  },

  /**
   * 특정 시/도의 시군구 목록 조회 (중복 제거 + 가나다순 정렬)
   * @param {string} region - 조회할 시/도명
   * @returns {Promise<Array<string>>} 해당 시/도의 시군구 목록 배열
   */
  async getCities(region) {
    // 특정 시/도에 속한 시군구 목록 조회
    const cities = await FuneralList.findAll({
      attributes: [
        // DISTINCT로 중복 제거된 시군구 목록
        [sequelize.fn('DISTINCT', sequelize.col('funeral_city')), 'city'],
      ],
      where: {
        // 지정된 시/도와 일치하는 레코드만 조회
        funeralRegion: region,
        // NULL 값 제외
        funeralCity: { [Op.ne]: null },
      },
      order: [
        // 시군구명 가나다순 정렬
        ['funeralCity', 'ASC'],
      ],
      raw: true, // 순수 JavaScript 객체로 반환
    });

    // 결과에서 시군구명만 추출하여 문자열 배열로 반환
    return cities.map((item) => item.city);
  },
};

export default managerFuneralListDao;
