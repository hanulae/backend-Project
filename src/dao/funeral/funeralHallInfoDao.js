/**
 * 파일명: funeralHallInfoDao.js
 * 설명: 장례식장 호실 정보 관련 데이터베이스 접근 객체
 */

import funeralHallInfo from '../../models/funeral/funeralHallInfo.js';

const funeralHallInfoDao = {
  /**
   * 장례식장 호실 정보 추가 생성
   *
   * 장례식장이 관리하는 호실 정보를 생성합니다.
   *
   * @param {Object} roomInfo - 생성할 호실 정보 객체
   *   @param {string} roomInfo.funeralId - 장례식장 ID
   *   @param {string} roomInfo.funeralHallName - 호실 이름
   *   @param {string} roomInfo.funeralHallSize - 호실 크기
   *   @param {number} roomInfo.funeralHallNumberOfMourners - 호실 수용 인원
   *   @param {number} roomInfo.funeralHallPrice - 호실 기본 가격
   *   @param {Object} roomInfo.funeralHallDetailPrice - 호실 상세 가격 정보
   *   @param {string} roomInfo.funeralHallStatus - 호실 상태
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Object>} 생성된 호실 정보 객체
   * @throws {Error} 호실 정보 생성 실패 시 발생
   */
  async createFuneralHallInfo(roomInfo, options = {}) {
    const result = await funeralHallInfo.create(roomInfo, options);

    return result;
  },

  /**
   * 장례식장 등록한 호실 정보 리스트 불러오기 (페이지네이션 적용)
   *
   * 장례식장 ID를 기반으로 호실 정보 리스트를 조회합니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @param {number} offset - 건너뛸 레코드 수
   * @param {number} limit - 가져올 레코드 수
   * @returns {object} count와 rows를 포함한 객체
   */
  async getFuneralHallInfoList(funeralId, offset = 0, limit = 10) {
    const result = await funeralHallInfo.findAndCountAll({
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
        'funeralHallStatus',
        'version',
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return result;
  },

  /**
   * 호실 정보 상세 조회
   *
   * 특정 호실 ID를 기반으로 호실 정보를 조회합니다.
   *
   * @param {string} funeralHallId - 호실 ID
   * @returns {object} 호실 정보
   */
  async getFuneralHallInfoDetail(funeralHallId) {
    return await funeralHallInfo.findByPk(funeralHallId);
  },

  /**
   * 호실 정보 수정
   *
   * 특정 호실 정보를 수정합니다.
   *
   * @param {object} newHallInfo - 수정할 호실 정보
   * @returns {object} 수정 결과
   */
  async updateFuneralHallInfo(newHallInfo) {
    const result = await funeralHallInfo.update(newHallInfo, {
      where: {
        funeralHallId: newHallInfo.funeralHallId,
        funeralId: newHallInfo.funeralId,
      },
    });

    return result;
  },

  /**
   * 버전 정보를 확인하며 수정 (낙관적 잠금)
   *
   * 호실 정보를 버전 정보를 확인하며 수정합니다.
   *
   * @param {object} newHallInfo - 수정할 호실 정보
   * @returns {object} 수정 결과
   */
  async updateFuneralHallInfoWithVersion(updateData, funeralHallId, funeralId, expectedVersion) {
    const result = await funeralHallInfo.update(
      {
        funeralHallName: updateData.funeralHallName,
        funeralHallSize: updateData.funeralHallSize,
        funeralHallNumberOfMourners: updateData.funeralHallNumberOfMourners,
        funeralHallPrice: updateData.funeralHallPrice,
        funeralHallDetailPrice: updateData.funeralHallDetailPrice,
        funeralHallStatus: updateData.funeralHallStatus,
        version: expectedVersion + 1,
      },
      {
        where: {
          funeralHallId: funeralHallId,
          funeralId: funeralId,
          version: expectedVersion,
        },
        returning: true,
      },
    );

    return result;
  },

  /**
   * funeralHallId를 기반으로 삭제된 모든 데이터까지 조회
   *
   * 특정 호실 ID를 기반으로 삭제된 모든 데이터를 조회합니다.
   *
   * @param {string} funeralHallId - 호실 ID
   * @returns {object} 삭제된 모든 데이터
   */
  async getFuneralHallINfoWithDeleted(funeralHallId) {
    const result = await funeralHallInfo.findAll({
      where: {
        funeralHallId: funeralHallId,
      },
      attributes: ['funeralHallId', 'funeralId', 'funeralHallName', 'version', 'deletedAt'],
      paranoid: false,
    });

    return result;
  },

  /**
   * 호실 정보 삭제
   *
   * 특정 호실 정보를 삭제합니다.
   *
   * @param {string} funeralHallId - 호실 ID
   * @returns {object} 삭제 결과
   */
  async deleteFuneralHallInfo(funeralHallId) {
    const result = await funeralHallInfo.destroy({
      where: {
        funeralHallId: funeralHallId,
      },
    });

    return result;
  },

  /**
   * 호실 요약 정보 불러오기 (장례식장 상세 페이지에 노출 되는 정보)
   *
   * 장례식장 ID를 기반으로 해당 장례식장의 호실 정보를 조회합니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Array<Object>>} 호실 정보를 포함한 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async getFuneralHallInfoSummary(funeralId) {
    const result = await funeralHallInfo.findAll({
      where: {
        funeralId: funeralId,
      },
      attributes: [
        'funeralHallId',
        'funeralHallName',
        'funeralHallSize',
        'funeralHallNumberOfMourners',
      ],
    });

    return result;
  },
};

export default funeralHallInfoDao;
