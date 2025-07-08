import funeralHallInfoDao from '../../dao/funeral/funeralHallInfoDao.js';
import funeralListDao from '../../dao/funeral/funeralListDao.js';
import logger from '../../config/logger.js';
import { sequelize } from '../../config/database.js';

const funeralHallInfoService = {
  async createFuneralHallInfo(roomInfo) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 호실 추가
      await funeralHallInfoDao.createFuneralHallInfo(roomInfo, { transaction });

      // 2. funeralList 테이블의 장례식장 정보 업데이트
      await funeralListDao.incrementFuneralTotalRooms(roomInfo.funeralId, 1, { transaction });

      await transaction.commit();

      return {
        success: true,
        message: '호실 정보 등록 완료',
      };
    } catch (error) {
      await transaction.rollback();
      logger.error(error.message);
      throw error;
    }
  },

  /**
   * 장례식장에 등록된 호실 정보 불러오기 (무한스크롤 적용)
   * @param {string} funeralId - 장례식장 ID
   * @param {number} page - 페이지 번호 (기본값: 1)
   * @param {number} limit - 페이지당 항목 수 (기본값: 10)
   * @returns {object} 호실 정보 리스트와 페이지 정보
   */
  async getFuneralHallInfoList(funeralId, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await funeralHallInfoDao.getFuneralHallInfoList(
        funeralId,
        offset,
        limit,
      );

      const totalPages = Math.ceil(count / limit);
      const hasNext = page < totalPages;
      const isLast = page >= totalPages;

      return {
        hallInfoList: rows,
        pageInfo: {
          currentPage: Number(page),
          totalItems: count,
          totalPages,
          hasNext,
          isLast,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      logger.error(error);
      throw error;
    }
  },

  /**
   * 호실 정보 상세 조회
   * @param {string} funeralHallId - 호실 ID
   * @returns {object} 호실 정보
   */
  async getFuneralHallInfoDetail(funeralHallId) {
    return await funeralHallInfoDao.getFuneralHallInfoDetail(funeralHallId);
  },

  /**
   * 낙관적 잠금을 사용한 호실 정보 수정
   * @param {object} newHallInfo - 수정할 호실 정보
   * @returns {object} 수정 결과
   */
  async updateFuneralHallInfo(newHallInfo) {
    try {
      const { funeralHallId, funeralId, version: clientVersion, ...updateData } = newHallInfo;

      // 1. 호실 정보 조회
      const currentHallInfo = await funeralHallInfoDao.getFuneralHallInfoDetail(funeralHallId);

      // 2. 호실이 존재하지 않을 경우
      if (!currentHallInfo) {
        throw {
          type: 'NOT_FOUND',
          message: '수정하려는 호실 정보를 찾을 수 없음',
          hallId: funeralHallId,
        };
      }

      // 3. 수정 권한 확인
      if (currentHallInfo.funeralId !== funeralId) {
        throw {
          type: 'UNAUTHORIZED',
          message: '수정 권한이 없음',
          hallId: funeralHallId,
        };
      }

      // 4. 버전 충돌 확인
      if (currentHallInfo.version !== clientVersion) {
        logger.warn(`버전 충돌 감지: 서버=${currentHallInfo.version}, 클라이언트=${clientVersion}`);
        throw {
          type: 'VERSION_CONFLICT',
          message: '다른 사용자가 이미 수정, 최신 정보를 조회하여 수정 필요',
          clientVersion: clientVersion,
          serverVersion: currentHallInfo.version,
        };
      }

      // 5. 수정 실행
      const [affectedRows] = await funeralHallInfoDao.updateFuneralHallInfoWithVersion(
        updateData,
        funeralHallId,
        funeralId,
        clientVersion,
      );

      logger.info(`호실 정보 수정 완료: 호실ID=${funeralHallId}, 수정된 행=${affectedRows}`);

      // 6. 수정 실패 확인 (동시성 문제)
      if (affectedRows === 0) {
        logger.warn('수정 실패 - 원인...');

        // 원인 파악을 위해 삭제된 정보까지 모두 조회
        const latestInfo = await funeralHallInfoDao.getFuneralHallINfoWithDeleted(funeralHallId);

        if (!latestInfo) {
          throw {
            type: 'NOT_FOUND',
            message: '호실 정보를 찾을 수 없습니다.',
            hallId: funeralHallId,
          };
        }

        if (latestInfo.deletedAt) {
          throw {
            type: 'ALREADY_DELETED',
            message: '이미 삭제된 호실 정보입니다.',
            hallId: funeralHallId,
            deletedAt: latestInfo.deletedAt,
          };
        }

        if (latestInfo.version !== clientVersion) {
          throw {
            type: 'VERSION_CONFLICT',
            message: '수정 중 다른 사용자가 먼저 수정했습니다.',
            currentData: latestInfo,
            clientVersion,
            serverVersion: latestInfo.version,
          };
        }

        // 기타 원인
        throw {
          type: 'UPDATE_FAILED',
          message: '알 수 없는 이유로 수정에 실패했습니다.',
        };
      }

      return {
        success: true,
        message: '호실 정보가 성공적으로 수정되었습니다.',
      };
    } catch (error) {
      logger.error('호실 정보 수정 실패:', error);
      throw error;
    }
  },

  /**
   * 호실 정보 삭제
   * @param {string} funeralHallId - 호실 ID
   * @param {string} funeralId - 장례식장 ID
   * @returns {object} 삭제 결과
   */
  async deleteFuneralHallInfo(funeralHallId, funeralId) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 호실 정보 조회
      const currentHallInfo = await funeralHallInfoDao.getFuneralHallInfoDetail(funeralHallId);

      if (!currentHallInfo) {
        throw new Error('삭제하려는 호실 정보를 찾을 수 없음');
      }

      if (currentHallInfo.funeralId !== funeralId) {
        throw new Error('삭제 권한이 없음');
      }

      // 2. 호실 삭제
      await funeralHallInfoDao.deleteFuneralHallInfo(funeralHallId, { transaction });

      // 3. funeralList 테이블의 호실 갯수 업데이트
      await funeralListDao.decrementFuneralTotalRooms(funeralId, 1, { transaction });

      await transaction.commit();

      return {
        success: true,
        message: '호실 정보가 성공적으로 삭제되었습니다.',
      };
    } catch (error) {
      await transaction.rollback();
      logger.error(error.message);
      throw error;
    }
  },

  /**
   * 호실 요약 정보 불러오기 (장례식장 상세 페이지에 노출 되는 정보)
   * 이름, 평수, 수용 가능 인원
   */
  async getFuneralHallInfoSummary(funeralId) {
    const result = await funeralHallInfoDao.getFuneralHallInfoSummary(funeralId);
    return result;
  },
};

export default funeralHallInfoService;
