// backend-project/src/services/common/fcmService.js
import admin from '../../config/firebase.js';
import logger from '../../config/logger.js';
import { sequelize } from '../../config/database.js';
import fcmTokenDao from '../../dao/common/fcmTokenDao.js';
import notificationHistoryDao from '../../dao/common/notificationHistoryDao.js';
import {
  getNotificationContent,
  canReceiveNotification,
} from '../../utils/notificationTemplates.js';
// import { validateUserExists } from '../../utils/userHelper.js';

const fcmService = {
  /**
   * FCM 토큰 등록/업데이트
   */
  async registerToken({ userId, userType, fcmToken, deviceId, deviceType }) {
    try {
      // 1. 사용자 존재 여부 검증 (테스트를 위해 임시로 주석 처리)
      // await validateUserExists(userId, userType);

      // 2. FCM 토큰 등록/업데이트
      const tokenRecord = await fcmTokenDao.createOrUpdateFcmToken({
        userId,
        userType,
        fcmToken,
        deviceId,
        deviceType,
      });

      logger.info(`FCM 토큰 등록 성공: ${userType}(${userId})`);
      return {
        success: true,
        data: tokenRecord,
        message: 'FCM 토큰이 성공적으로 등록되었습니다.',
      };
    } catch (error) {
      logger.error('FCM 토큰 등록 실패:', error);
      throw error;
    }
  },

  /**
   * 단일 사용자에게 푸시 알림 전송
   */
  async sendNotificationToUser({
    receiverId,
    receiverType,
    notificationType,
    data = {},
    senderId = null,
    senderType = 'system',
  }) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 알림 권한 확인
      if (!canReceiveNotification(receiverType, notificationType)) {
        await transaction.rollback();
        logger.warn(`사용자 ${receiverType}는 ${notificationType} 알림을 받을 수 없습니다.`);
        return { success: false, reason: 'No permission' };
      }

      // 2. 알림 내용 생성
      const { title, body } = getNotificationContent(notificationType, data);

      // 3. 사용자의 활성 FCM 토큰 조회
      const tokens = await fcmTokenDao.findActiveTokensByUser(receiverId, receiverType);

      // 4. 알림 이력 저장
      const notification = await notificationHistoryDao.createNotification(
        {
          receiverId,
          receiverType,
          senderId,
          senderType,
          notificationType,
          title,
          body,
          data,
        },
        { transaction },
      );

      if (tokens.length === 0) {
        await transaction.commit();
        logger.warn(`활성 FCM 토큰이 없습니다: ${receiverType}(${receiverId})`);
        return { success: false, reason: 'No active tokens' };
      }

      // 5. FCM 전송
      const fcmTokens = tokens.map((token) => token.fcmToken);
      const message = {
        notification: { title, body },
        data: {
          notificationId: notification.notificationId,
          notificationType,
          receiverType,
          ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
        },
        tokens: fcmTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // 6. 실패한 토큰 처리
      if (response.failureCount > 0) {
        await this.handleFailedTokens(response.responses, tokens, { transaction });
      }

      await transaction.commit();

      logger.info(`알림 전송 완료: ${title} → ${receiverType}(${receiverId})`);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        notificationId: notification.notificationId,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('FCM 알림 전송 실패:', error);
      throw error;
    }
  },

  /**
   * 장례식장 그룹(대표 + 모든 직원)에게 푸시 알림 전송
   */
  async sendNotificationToFuneralGroup({
    funeralId,
    notificationType,
    data = {},
    senderId,
    senderType,
  }) {
    const transaction = await sequelize.transaction();
    try {
      // 1. 알림 권한 확인
      if (!canReceiveNotification('funeral', notificationType)) {
        await transaction.rollback();
        logger.warn(`장례식장 그룹은 ${notificationType} 알림을 받을 수 없습니다.`);
        return { success: false, reason: 'No permission' };
      }

      // 2. 알림 내용 생성
      const { title, body } = getNotificationContent(notificationType, data);

      // 3. 장례식장 그룹의 사용자 정보 조회
      const groupUsers = await fcmTokenDao.findFuneralGroupUsers(funeralId);

      // 4. 장례식장 그룹의 활성 FCM 토큰 조회
      const tokens = await fcmTokenDao.findActiveTokensByFuneralGroup(funeralId);

      // 5. 각 사용자별로 알림 이력 저장 (FCM 토큰이 없어도 이력은 저장)
      const notificationPromises = groupUsers.map((user) =>
        notificationHistoryDao.createNotification(
          {
            receiverId: user.userId,
            receiverType: user.userType,
            senderId,
            senderType,
            notificationType,
            title,
            body,
            data,
          },
          { transaction },
        ),
      );

      const notifications = await Promise.all(notificationPromises);

      // 6. FCM 토큰이 없는 경우 알림 이력만 저장하고 종료
      if (tokens.length === 0) {
        await transaction.commit();
        logger.warn(
          `장례식장 그룹의 활성 FCM 토큰이 없습니다: 장례식장 ${funeralId} (알림 이력은 저장됨)`,
        );
        return {
          success: false,
          reason: 'No active tokens',
          notificationIds: notifications.map((n) => n.notificationId),
          targetUsers: groupUsers.length,
        };
      }

      // 7. FCM 전송
      const fcmTokens = tokens.map((token) => token.fcmToken);
      const message = {
        notification: { title, body },
        data: {
          notificationType,
          funeralId: String(funeralId),
          ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
        },
        tokens: fcmTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      // 8. 실패한 토큰 처리
      if (response.failureCount > 0) {
        await this.handleFailedTokens(response.responses, tokens, { transaction });
      }

      await transaction.commit();

      logger.info(
        `장례식장 그룹 알림 전송 완료: ${title} → 장례식장 ${funeralId} (${groupUsers.length}명)`,
      );
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        notificationIds: notifications.map((n) => n.notificationId),
        targetUsers: groupUsers.length,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('장례식장 그룹 FCM 알림 전송 실패:', error);
      throw error;
    }
  },

  /**
   * 실패한 토큰들 처리
   */
  async handleFailedTokens(responses, tokens, options = {}) {
    const failedTokenIds = [];

    responses.forEach((response, index) => {
      if (!response.success) {
        const errorCode = response.error?.code;
        if (
          [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
          ].includes(errorCode)
        ) {
          failedTokenIds.push(tokens[index].fcmTokenId);
        }
      }
    });

    if (failedTokenIds.length > 0) {
      await fcmTokenDao.deactivateTokensById(failedTokenIds, options);
      logger.info(`비활성화된 토큰 수: ${failedTokenIds.length}`);
    }
  },

  /**
   * 알림 목록 조회
   */
  async getNotifications(userId, userType, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      const result = await notificationHistoryDao.findNotificationsByUser(userId, userType, {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true',
      });

      const unreadCount = await notificationHistoryDao.countUnreadByUser(userId, userType);

      return {
        success: true,
        data: {
          notifications: result.rows,
          pagination: {
            totalCount: result.count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(result.count / limit),
          },
          unreadCount,
        },
      };
    } catch (error) {
      logger.error('알림 목록 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자별 모든 FCM 토큰 비활성화 (로그아웃 시)
   */
  async deactivateUserTokens({ userId, userType, deviceId = null }) {
    try {
      const whereCondition = { userId, userType, isActive: true };

      // 특정 기기만 비활성화하는 경우
      if (deviceId) {
        whereCondition.deviceId = deviceId;
      }

      const [affectedCount] = await fcmTokenDao.deactivateUserTokens(whereCondition);

      logger.info(`FCM 토큰 비활성화 완료: ${userType}(${userId}) - ${affectedCount}개 토큰`);
      return {
        success: true,
        deactivatedCount: affectedCount,
        message: 'FCM 토큰이 비활성화되었습니다.',
      };
    } catch (error) {
      logger.error('FCM 토큰 비활성화 실패:', error);
      throw error;
    }
  },

  /**
   * 특정 기기의 FCM 토큰만 비활성화
   */
  async deactivateDeviceToken({ userId, userType, deviceId }) {
    return await this.deactivateUserTokens({ userId, userType, deviceId });
  },
};

export default fcmService;
