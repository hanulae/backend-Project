import managerFuneralListDao from '../../daos/manager/managerFuneralListDao.js';
import * as funeralListDao from '../../daos/funeral/funeralListDao.js';

const funeralListService = {
  /**
   * 장례식장 상세 조회
   * @param {*} funeralListId
   * @returns
   */
  async getFuneralDetail(funeralListId) {
    const funeralDetail = await managerFuneralListDao.getFuneralDetail(funeralListId);

    if (!funeralDetail)
      throw new Error('실패: 해당 funeralListId로 저장된 장례식장 데이터가 없습니다.');

    // 이미지 데이터를 가져옵니다.
    const images = await funeralListDao.findImagesByFuneralListId(funeralListId);

    return {
      funeralDetail,
      images,
    };
  },

  /**
   * 통합 검색 서비스
   * @param {object} searchParams
   * @returns
   */
  async searchFuneralList({ keyword, sido, sigungu, page, limit }) {
    const offset = (page - 1) * limit;
    const { count, rows } = await managerFuneralListDao.searchFuneralList({
      keyword,
      sido,
      sigungu,
      offset,
      limit,
    });
    return {
      funerals: rows,
      pageInfo: {
        currentPage: Number(page),
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        hasNext: Number(page) < Math.ceil(count / limit),
        isLast: Number(page) >= Math.ceil(count / limit),
      },
    };
  },

  /**
   * 시/도 목록 조회
   * @returns
   */
  async getRegions() {
    const regions = await managerFuneralListDao.getRegions();

    return regions;
  },

  /**
   * 시/군/구 목록 조회
   * @param {*} region
   * @returns
   */
  async getCities(region) {
    const cities = await managerFuneralListDao.getCities(region);

    return cities;
  },
};

export default funeralListService;
