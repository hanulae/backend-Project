import managerFuneralListDao from '../../daos/manager/managerFuneralListDao.js';

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

    return funeralDetail;
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
};

export default funeralListService;
