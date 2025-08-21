/**
 * 파일명: fcmTokenDao.js
 * 설명: FCM 토큰 관련 데이터베이스 접근 객체
 * 사용자 기기의 FCM 토큰 등록, 업데이트, 조회 및 관리 기능을 제공합니다.
 */

import db from '../../models/index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';

const fcmTokenDao = {
  /**
   * FCM 토큰 등록/업데이트
   *
   * 사용자의 FCM 토큰을 등록하거나 업데이트합니다.
   * 동일한 토큰이 존재하는 경우 정보를 업데이트하고,
   * 새로운 토큰인 경우 기존 토큰을 비활성화하고 새 토큰을 등록합니다.
   *
   * @param {Object} tokenData - 토큰 데이터 객체
   *   @param {string} tokenData.userId - 사용자 ID
   *   @param {string} tokenData.userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   *   @param {string} tokenData.fcmToken - Firebase Cloud Messaging 토큰
   *   @param {string} tokenData.deviceId - 기기 ID
   *   @param {string} tokenData.deviceType - 기기 유형 ('ios', 'android', 'web' 등)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Object>} 등록되거나 업데이트된 FCM 토큰 객체
   * @throws {Error} 토큰 등록/업데이트 실패 시 발생
   */
  async createOrUpdateFcmToken(tokenData, options = {}) {
    try {
      const { userId, userType, fcmToken, deviceId, deviceType } = tokenData;

      // 1. 먼저 동일한 FCM 토큰이 존재하는지 확인
      const existingToken = await db.FcmToken.findOne({
        where: { fcmToken },
        ...options,
      });

      if (existingToken) {
        // 2. 기존 토큰이 있으면 업데이트
        await db.FcmToken.update(
          {
            userId,
            userType,
            deviceId,
            deviceType,
            isActive: true,
            lastUsedAt: new Date(),
          },
          {
            where: { fcmToken },
            ...options,
          },
        );

        // 3. 같은 사용자의 다른 토큰들은 비활성화 (현재 토큰 제외)
        await db.FcmToken.update(
          { isActive: false },
          {
            where: {
              userId,
              userType,
              fcmToken: { [Op.ne]: fcmToken },
            },
            ...options,
          },
        );

        // 4. 업데이트된 토큰 반환
        return await db.FcmToken.findOne({
          where: { fcmToken },
          ...options,
        });
      } else {
        // 5. 기존 토큰이 없으면 사용자의 모든 토큰 비활성화 후 새로 생성
        await db.FcmToken.update(
          { isActive: false },
          {
            where: { userId, userType },
            ...options,
          },
        );

        // 6. 새 토큰 생성
        return await db.FcmToken.create(
          {
            userId,
            userType,
            fcmToken,
            deviceId,
            deviceType,
            isActive: true,
            lastUsedAt: new Date(),
          },
          options,
        );
      }
    } catch (error) {
      logger.error('FCM 토큰 생성/업데이트 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 사용자의 활성 FCM 토큰 조회
   *
   * 특정 사용자의 활성 상태인 FCM 토큰을 모두 조회합니다.
   * 가장 최근에 사용된 순서로 정렬됩니다.
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   * @returns {Promise<Array<Object>>} 활성 FCM 토큰 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async findActiveTokensByUser(userId, userType) {
    try {
      return await db.FcmToken.findAll({
        where: {
          userId,
          userType,
          isActive: true,
        },
        order: [['lastUsedAt', 'DESC']],
      });
    } catch (error) {
      logger.error('활성 FCM 토큰 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * FCM 토큰으로 토큰 정보 조회
   *
   * 특정 FCM 토큰 값으로 해당 토큰의 정보를 조회합니다.
   * 활성 상태인 토큰만 조회합니다.
   *
   * @param {string} fcmToken - 조회할 FCM 토큰 값
   * @returns {Promise<Object|null>} FCM 토큰 객체 또는 없을 경우 null
   * @throws {Error} 조회 실패 시 발생
   */
  async findByToken(fcmToken) {
    try {
      return await db.FcmToken.findOne({
        where: { fcmToken, isActive: true },
      });
    } catch (error) {
      logger.error('FCM 토큰 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 토큰 비활성화
   *
   * 특정 FCM 토큰을 비활성화합니다.
   * 로그아웃, 기기 변경 또는 토큰 만료 시 호출됩니다.
   *
   * @param {string} fcmToken - 비활성화할 FCM 토큰 값
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 비활성화 실패 시 발생
   */
  async deactivateToken(fcmToken, options = {}) {
    try {
      return await db.FcmToken.update(
        { isActive: false },
        {
          where: { fcmToken },
          ...options,
        },
      );
    } catch (error) {
      logger.error('FCM 토큰 비활성화 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 여러 토큰 비활성화 (토큰 ID 배열로)
   *
   * 여러 개의 FCM 토큰을 한번에 비활성화합니다.
   * 토큰 ID 배열을 입력받아 해당하는 모든 토큰을 비활성화합니다.
   *
   * @param {Array<string>} tokenIds - 비활성화할 토큰 ID 배열
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 비활성화 실패 시 발생
   */
  async deactivateTokensById(tokenIds, options = {}) {
    try {
      return await db.FcmToken.update(
        { isActive: false },
        {
          where: { fcmTokenId: tokenIds },
          ...options,
        },
      );
    } catch (error) {
      logger.error('FCM 토큰 일괄 비활성화 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 마지막 사용 시간 업데이트
   *
   * 특정 FCM 토큰의 마지막 사용 시간을 현재 시간으로 업데이트합니다.
   * 알림 전송이나 토큰 사용 시 호출됩니다.
   *
   * @param {string} fcmToken - 업데이트할 FCM 토큰 값
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 업데이트 실패 시 발생
   */
  async updateLastUsed(fcmToken, options = {}) {
    try {
      return await db.FcmToken.update(
        { lastUsedAt: new Date() },
        {
          where: { fcmToken, isActive: true },
          ...options,
        },
      );
    } catch (error) {
      logger.error('FCM 토큰 마지막 사용시간 업데이트 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 사용자별 FCM 토큰 비활성화 (로그아웃 시)
   *
   * 특정 사용자의 모든 FCM 토큰을 비활성화합니다.
   * 주로 사용자 로그아웃 시 호출됩니다.
   *
   * @param {Object} whereCondition - 조건 객체 (userId, userType 등)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 비활성화 실패 시 발생
   */
  async deactivateUserTokens(whereCondition, options = {}) {
    try {
      return await db.FcmToken.update(
        { isActive: false },
        {
          where: whereCondition,
          ...options,
        },
      );
    } catch (error) {
      logger.error('사용자 FCM 토큰 비활성화 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 사용자의 모든 토큰 삭제 (계정 삭제 시)
   *
   * 특정 사용자의 모든 FCM 토큰을 삭제합니다.
   * 주로 사용자 계정 삭제 시 호출됩니다.
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<number>} 삭제된 행 수
   * @throws {Error} 삭제 실패 시 발생
   */
  async deleteAllUserTokens(userId, userType, options = {}) {
    try {
      return await db.FcmToken.destroy({
        where: { userId, userType },
        ...options,
      });
    } catch (error) {
      logger.error('사용자 FCM 토큰 전체 삭제 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 비활성 토큰 정리 (정기 정리 작업용)
   *
   * 오래된 비활성 토큰을 정리합니다.
   * 일정 기간(기본값: 30일) 이상 업데이트되지 않은 비활성 토큰을 삭제합니다.
   * 정기적인 정리 작업에 사용됩니다.
   *
   * @param {number} daysAgo - 이 일수보다 오래된 토큰을 정리 (기본값: 30일)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<number>} 삭제된 행 수
   * @throws {Error} 정리 실패 시 발생
   */
  async cleanupInactiveTokens(daysAgo = 30, options = {}) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      return await db.FcmToken.destroy({
        where: {
          isActive: false,
          updatedAt: {
            [db.Sequelize.Op.lt]: cutoffDate,
          },
        },
        ...options,
      });
    } catch (error) {
      logger.error('비활성 FCM 토큰 정리 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 사용자별 활성 토큰 수 조회
   *
   * 특정 사용자의 활성 토큰 수를 조회합니다.
   * 사용자의 기기 수 파악에 유용합니다.
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   * @returns {Promise<number>} 활성 토큰 수
   * @throws {Error} 조회 실패 시 발생
   */
  async countActiveTokensByUser(userId, userType) {
    try {
      return await db.FcmToken.count({
        where: {
          userId,
          userType,
          isActive: true,
        },
      });
    } catch (error) {
      logger.error('사용자별 활성 토큰 수 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 지정된 날짜 이전에 마지막으로 사용된 토큰들을 비활성화
   *
   * 지정된 날짜 이전에 마지막으로 사용된 토큰들을 모두 비활성화합니다.
   * 오래된 토큰 정리에 사용됩니다.
   *
   * @param {Date} beforeDate - 이 날짜 이전에 마지막으로 사용된 토큰들을 비활성화
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<number>} 비활성화된 행 수
   * @throws {Error} 비활성화 실패 시 발생
   */
  async deactivateOldTokens(beforeDate, options = {}) {
    try {
      const [affectedCount] = await db.FcmToken.update(
        { isActive: false },
        {
          where: {
            lastUsedAt: {
              [Op.lt]: beforeDate,
            },
            isActive: true,
          },
          ...options,
        },
      );

      logger.info(`${affectedCount}개의 오래된 FCM 토큰이 비활성화되었습니다.`);
      return affectedCount;
    } catch (error) {
      logger.error('FCM 토큰 비활성화 실패:', error);
      throw error;
    }
  },

  /**
   * 최근에 사용된 토큰들의 lastUsedAt 업데이트
   *
   * 최근에 알림이 전송된 토큰들의 마지막 사용 시간을 현재 시간으로 업데이트합니다.
   * 알림 이력을 토대로 토큰 사용 시간을 업데이트합니다.
   *
   * @param {Date} sinceDate - 이 날짜 이후에 알림이 전송된 토큰들을 업데이트
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<number>} 업데이트된 행 수
   * @throws {Error} 업데이트 실패 시 발생
   */
  async updateRecentlyUsedTokens(sinceDate, options = {}) {
    try {
      // 최근 알림이 전송된 토큰들을 찾아서 lastUsedAt 업데이트
      const [affectedCount] = await sequelize.query(
        `
        UPDATE fcm_tokens 
        SET "lastUsedAt" = NOW(), "updatedAt" = NOW()
        WHERE "fcmTokenId" IN (
          SELECT DISTINCT ft."fcmTokenId"
          FROM fcm_tokens ft
          INNER JOIN notification_history nh 
            ON ft."userId" = nh."receiverId" 
            AND ft."userType" = nh."receiverType"
          WHERE nh."sentAt" >= :sinceDate
            AND ft."isActive" = true
        )
        `,
        {
          replacements: { sinceDate },
          type: sequelize.QueryTypes.UPDATE,
          ...options,
        },
      );

      logger.info(`${affectedCount}개의 FCM 토큰 사용 시간이 업데이트되었습니다.`);
      return affectedCount;
    } catch (error) {
      logger.error('FCM 토큰 사용 시간 업데이트 실패:', error);
      throw error;
    }
  },

  /**
   * 장례식장 그룹의 활성 FCM 토큰 조회 (대표 + 모든 직원)
   *
   * 특정 장례식장의 대표와 모든 직원의 활성 FCM 토큰을 조회합니다.
   * 장례식장 그룹 단위로 알림을 전송할 때 사용됩니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Array<Object>>} 활성 FCM 토큰 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async findActiveTokensByFuneralGroup(funeralId) {
    try {
      // 1. 장례식장 대표의 토큰 조회
      const funeralTokens = await db.FcmToken.findAll({
        where: {
          userId: funeralId,
          userType: 'funeral',
          isActive: true,
        },
        order: [['lastUsedAt', 'DESC']],
      });

      // 2. 해당 장례식장의 모든 직원 ID 조회
      const staffList = await db.FuneralStaff.findAll({
        where: {
          funeralId: funeralId,
        },
        attributes: ['funeralStaffId'],
      });

      const staffIds = staffList.map((staff) => staff.funeralStaffId);

      // 3. 직원들의 토큰 조회
      let staffTokens = [];
      if (staffIds.length > 0) {
        staffTokens = await db.FcmToken.findAll({
          where: {
            userId: {
              [Op.in]: staffIds,
            },
            userType: 'funeralStaff',
            isActive: true,
          },
          order: [['lastUsedAt', 'DESC']],
        });
      }

      // 3. 대표 토큰과 직원 토큰들을 합쳐서 반환
      const allTokens = [...funeralTokens, ...staffTokens];

      logger.info(
        `장례식장 그룹 토큰 조회 완료: 대표 ${funeralTokens.length}개, 직원 ${staffTokens.length}개, 총 ${allTokens.length}개`,
      );

      return allTokens;
    } catch (error) {
      logger.error('장례식장 그룹 활성 FCM 토큰 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 장례식장 그룹의 사용자 정보 조회 (알림 이력 저장용)
   *
   * 특정 장례식장의 대표와 모든 직원의 사용자 정보를 조회합니다.
   * 알림 이력 저장을 위해 사용됩니다.
   *
   * @param {string} funeralId - 장례식장 ID
   * @returns {Promise<Array<Object>>} 사용자 정보 객체 배열
   * @throws {Error} 조회 실패 시 발생
   */
  async findFuneralGroupUsers(funeralId) {
    try {
      const users = [];

      // 1. 장례식장 대표 정보 추가
      const funeral = await db.Funeral.findByPk(funeralId, {
        attributes: ['funeralId', 'funeralName', 'funeralPhoneNumber'],
      });

      if (funeral) {
        users.push({
          userId: funeralId,
          userType: 'funeral',
          name: funeral.funeralName || '장례식장 대표',
          phoneNumber: funeral.funeralPhoneNumber,
        });

        logger.info(
          `장례식장 대표 정보 조회 완료: ${funeral.funeralName}, ${funeral.funeralPhoneNumber}`,
        );
      }

      // 2. 해당 장례식장의 모든 직원 정보 추가
      const staffList = await db.FuneralStaff.findAll({
        where: {
          funeralId: funeralId,
        },
        attributes: ['funeralStaffId', 'funeralStaffName', 'funeralStaffPhoneNumber'],
      });

      staffList.forEach((staff) => {
        users.push({
          userId: staff.funeralStaffId,
          userType: 'funeralStaff',
          name: staff.funeralStaffName,
          phoneNumber: staff.funeralStaffPhoneNumber,
        });

        logger.info(
          `장례식장 직원 정보 조회 완료: ${staff.funeralStaffName}, ${staff.funeralStaffPhoneNumber}`,
        );
      });

      logger.info(`장례식장 그룹 사용자 조회 완료: 총 ${users.length}명`);
      return users;
    } catch (error) {
      logger.error('장례식장 그룹 사용자 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 알림 설정 업데이트
   *
   * 사용자의 모든 활성 FCM 토큰에 대해 알림 설정을 업데이트 합니다.
   *
   * @param {Object} whereCondition - 조건 객체 (userId, userType)
   * @param {Object} updateData - 업데이트할 데이터 객체
   */
  async updateNotificationSettings(whereCondition, updateData, options = {}) {
    try {
      return await db.FcmToken.update(updateData, {
        where: {
          ...whereCondition,
          isActive: true,
        },
        ...options,
      });
    } catch (error) {
      logger.error('알림 설정 업데이트 DAO 오류: ', error);
      throw error;
    }
  },
};

export default fcmTokenDao;
