import db from '../../models/index.js';
import logger from '../../config/logger.js';
import { Op } from 'sequelize';
import { sequelize } from '../../config/database.js';

const fcmTokenDao = {
  /**
   * FCM 토큰 등록/업데이트
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
};

export default fcmTokenDao;
