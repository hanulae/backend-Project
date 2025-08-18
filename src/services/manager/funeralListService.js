/**
 * 파일명: funeralListService.js
 * 설명: 상조팀장 관점에서의 장례식장 목록 관련 비즈니스 로직 처리 서비스
 * 역할: 상조팀장이 장례식장 정보를 조회하고 검색하는 기능 제공
 */
import managerFuneralListDao from '../../daos/manager/managerFuneralListDao.js';
import * as funeralListDao from '../../daos/funeral/funeralListDao.js';

const funeralListService = {
  /**
   * 장례식장 상세 정보 조회
   *
   * 특정 장례식장의 상세 정보와 이미지를 조회합니다.
   *
   * @param {string} funeralListId - 장례식장 ID
   * @returns {Promise<Object>} 장례식장 상세 정보 및 이미지
   * @throws {Error} 장례식장 정보가 없을 경우 오류 발생
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
   * 장례식장 통합 검색
   *
   * 키워드, 지역 등의 조건으로 장례식장을 검색하고 페이지네이션을 적용합니다.
   *
   * @param {Object} searchParams - 검색 파라미터
   * @param {string} [searchParams.keyword] - 검색 키워드
   * @param {string} [searchParams.sido] - 시/도 지역
   * @param {string} [searchParams.sigungu] - 시/군/구 지역
   * @param {number} searchParams.page - 페이지 번호
   * @param {number} searchParams.limit - 페이지당 항목 수
   * @returns {Promise<Object>} 검색 결과 및 페이지 정보
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
   *
   * 장례식장 검색을 위한 시/도 지역 목록을 조회합니다.
   *
   * @returns {Promise<Array>} 시/도 지역 목록
   */
  async getRegions() {
    const regions = await managerFuneralListDao.getRegions();

    return regions;
  },

  /**
   * 시/군/구 목록 조회
   *
   * 특정 시/도에 속한 시/군/구 지역 목록을 조회합니다.
   *
   * @param {string} region - 시/도 지역명
   * @returns {Promise<Array>} 시/군/구 지역 목록
   */
  async getCities(region) {
    const cities = await managerFuneralListDao.getCities(region);

    return cities;
  },
};

export default funeralListService;
