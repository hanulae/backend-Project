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
   * 장례식장 등록한 호실 정보 리스트 불러오기 (페이지네이션 적용)
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
      attributes: ['funeralHallId', 'funeralHallName'],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
    });

    return result;
  },

  /**
   * 호실 정보 상세 조회
   * @param {string} funeralHallId - 호실 ID
   * @returns {object} 호실 정보
   */
  async getFuneralHallInfoDetail(funeralHallId) {
    return await funeralHallInfo.findByPk(funeralHallId);
  },

  /**
   * 호실 정보 수정
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
};

export default funeralHallInfoDao;
