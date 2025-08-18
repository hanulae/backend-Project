/**
 * 파일명: fcmService.js
 * 설명: FCM 관련 서비스: 토큰 관리, 알림 전송, 실패 토큰 처리, 알림 목록 조회 등
 * 역할: FCM 토큰 관리, 알림 전송, 실패 토큰 처리, 알림 목록 조회 등
 */
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
import { validateUserExists } from '../../utils/userHelper.js';

const fcmService = {
  /**
   * FCM 토큰 등록/업데이트
   *
   * 처리 과정:
   * 1. 사용자 존재 여부 검증
   * 2. FCM 토큰 등록/업데이트
   *
   *
   * @param {Object} params
   * @param {number} params.userId
   * @param {UserType} params.userType
   * @param {string} params.fcmToken
   * @param {string} params.deviceId
   * @param {DeviceType} params.deviceType - 'ios' | 'android'
   *
   * @returns {Promise<Object>}
   * @returns {boolean} success - 성공 여부
   * @returns {Object} data - FCM 토큰 데이터
   * @returns {string} message - 결과 메시지
   *
   * @throws {Error} 사용자 존재 여부 검증 실패 시 오류 발생
   * @throws {Error} FCM 토큰 등록/업데이트 실패 시 오류 발생
   */
  async registerToken({ userId, userType, fcmToken, deviceId, deviceType }) {
    try {
      // 1. 사용자 존재 여부 검증
      await validateUserExists(userId, userType);

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
   *
   * 처리과정:
   * 1. 알림 권한 확인
   * 2. 알림 내용 생성
   * 3. 사용자의 활성 FCM 토큰 조회
   * 4. 알림 이력 저장
   * 5. 배지 카운트 조회
   * 6. FCM 전송
   * 7. 실패한 토큰 처리
   *
   * @param {Object} params
   * @param {number} params.receiverId
   * @param {UserType} params.receiverType
   * @param {NotificationType} params.notificationType
   * @param {Record<string, string|number|boolean>} [params.data={}]
   * @param {number|null} [params.senderId=null]
   * @param {UserType} [params.senderType='system']
   *
   * @returns {Promise<Object>}
   * @returns {boolean} success - 성공 여부
   * @returns {number} successCount - 성공한 토큰 수
   * @returns {number} failureCount - 실패한 토큰 수
   * @returns {number} notificationId - 알림 ID
   * @returns {string} reason - 실패 이유
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

      // 5. 배지 카운트 조회 (알림 전송 후 읽지 않은 알림 개수)
      const badgeCount = await notificationHistoryDao.countUnreadByUser(receiverId, receiverType);

      // 6. FCM 전송
      const fcmTokens = tokens.map((token) => token.fcmToken);
      const message = {
        notification: { title, body },
        data: {
          notificationId: notification.notificationId,
          notificationType,
          receiverType,
          ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
        },
        // iOS 배지 설정
        apns: {
          payload: {
            aps: {
              badge: badgeCount + 1, // 현재 알림 포함하여 배지 카운트 설정
            },
          },
        },
        // Android 배지 설정 (일부 런처에서 지원)
        android: {
          notification: {
            notificationCount: badgeCount + 1,
          },
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
   *
   * 처리 과정:
   * 1. 알림 권한 확인
   * 2. 알림 내용 생성
   * 3. 장례식장 그룹의 사용자 정보 조회
   * 4. 장례식장 그룹의 활성 FCM 토큰 조회
   * 5. 각 사용자별로 알림 이력 저장 (FCM 토큰이 없어도 이력은 저장)
   * 6. FCM 토큰이 없는 경우 알림 이력만 저장하고 종료
   * 7. 각 사용자별 배지 카운트 계산 및 개별 FCM 전송
   * 8. 실패한 토큰 처리
   * 9. 트랜잭션 커밋
   * 10. 성공 응답 반환
   * 11. 실패 시 예외 처리
   *
   * @param {Object} params
   * @param {string} params.funeralId
   * @param {string} params.notificationType
   * @param {Object} params.data
   * @param {string} params.senderId
   * @param {string} params.senderType
   *
   * @returns {Promise<Object>}
   * @returns {boolean} success - 성공 여부
   * @returns {number} successCount - 성공한 토큰 수
   * @returns {number} failureCount - 실패한 토큰 수
   * @returns {number[]} notificationIds - 알림 ID 목록
   * @returns {number} targetUsers - 대상 사용자 수
   * @returns {string} reason - 실패 이유
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

      // 7. 각 사용자별 배지 카운트 계산 및 개별 FCM 전송
      const messagePromises = [];
      const userTokenMap = new Map();

      // 토큰을 사용자별로 그룹핑
      tokens.forEach((token) => {
        const userKey = `${token.userId}_${token.userType}`;
        if (!userTokenMap.has(userKey)) {
          userTokenMap.set(userKey, {
            userId: token.userId,
            userType: token.userType,
            tokens: [],
          });
        }
        userTokenMap.get(userKey).tokens.push(token.fcmToken);
      });

      // 각 사용자별로 배지 카운트 계산하고 메시지 전송
      for (const [, userInfo] of userTokenMap) {
        const badgeCount = await notificationHistoryDao.countUnreadByUser(
          userInfo.userId,
          userInfo.userType,
        );

        const userMessage = {
          notification: { title, body },
          data: {
            notificationType,
            funeralId: String(funeralId),
            ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
          },
          // iOS 배지 설정
          apns: {
            payload: {
              aps: {
                badge: badgeCount + 1, // 현재 알림 포함하여 배지 카운트 설정
              },
            },
          },
          // Android 배지 설정 (일부 런처에서 지원)
          android: {
            notification: {
              notificationCount: badgeCount + 1,
            },
          },
          tokens: userInfo.tokens,
        };

        messagePromises.push(admin.messaging().sendEachForMulticast(userMessage));
      }

      // 모든 메시지 전송 결과 수집
      const responses = await Promise.allSettled(messagePromises);

      // 성공/실패 카운트 집계
      let totalSuccessCount = 0;
      let totalFailureCount = 0;
      const allResponses = [];

      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const response = result.value;
          totalSuccessCount += response.successCount;
          totalFailureCount += response.failureCount;
          allResponses.push(...response.responses);
        } else {
          logger.error(`장례식장 그룹 FCM 전송 실패 (사용자 ${index}):`, result.reason);
          // 실패한 경우 모든 토큰을 실패로 처리
          const userTokens = Array.from(userTokenMap.values())[index].tokens;
          totalFailureCount += userTokens.length;
          allResponses.push(...userTokens.map(() => ({ success: false, error: result.reason })));
        }
      });

      const response = {
        successCount: totalSuccessCount,
        failureCount: totalFailureCount,
        responses: allResponses,
      };

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
   * FCM 전송 응답에서 무효/폐기된 토큰을 비활성화
   * 기준 에러코드:
   *  - messaging/registration-token-not-registered
   *  - messaging/invalid-registration-token
   * 전제: responses와 tokens의 인덱스가 서로 1:1로 대응한다.
   *
   * @param {Array<{success: boolean, error?: {code?: string}}>} responses FCM 개별 전송 응답 배열
   * @param {Array<{fcmTokenId: number}>} tokens 전송에 사용한 토큰 레코드 배열(응답과 동일 순서)
   * @param {object} [options] Sequelize 옵션(예: { transaction })
   * @returns {Promise<void>} 비활성화만 수행(예외 전파는 상위에서 처리)
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
   *
   * 처리 과정:
   * 1. 알림 목록 조회
   * 2. 읽지 않은 알림 개수 조회
   * 3. 성공 응답 반환
   * 4. 실패 시 예외 처리
   *
   * @param {string} userId
   * @param {string} userType
   * @param {Object} params
   * @param {number} [params.page=1]
   * @param {number} [params.limit=20]
   * @param {boolean} [params.unreadOnly=false]
   *
   * @returns {Promise<Object>}
   * @returns {boolean} success - 성공 여부
   * @returns {Object} data - 알림 목록 데이터
   * @returns {Array} notifications - 알림 목록
   * @returns {Object} pagination - 페이지네이션 정보
   * @returns {number} totalCount - 총 알림 개수
   * @returns {number} currentPage - 현재 페이지
   * @returns {number} totalPages - 총 페이지 수
   * @returns {number} unreadCount - 읽지 않은 알림 개수
   *
   * @throws {Error} 알림 목록 조회 실패 시 오류 발생
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
   *
   * 처리 과정:
   * 1. 사용자 토큰 비활성화
   * 2. 성공 응답 반환
   * 3. 실패 시 예외 처리
   *
   * @param {string} userId
   * @param {string} userType
   * @param {string} deviceId
   * @returns {Promise<Object>}
   * @returns {boolean} success - 성공 여부
   * @returns {number} deactivatedCount - 비활성화된 토큰 수
   * @returns {string} message - 결과 메시지
   *
   * @throws {Error} FCM 토큰 비활성화 실패 시 오류 발생
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
   * @param {string} userId
   * @param {string} userType
   * @param {string} deviceId
   * @returns {Promise<Object>}
   * @returns {boolean} success - 성공 여부
   * @returns {number} deactivatedCount - 비활성화된 토큰 수
   * @returns {string} message - 결과 메시지
   *
   * @throws {Error} FCM 토큰 비활성화 실패 시 오류 발생
   */
  async deactivateDeviceToken({ userId, userType, deviceId }) {
    return await this.deactivateUserTokens({ userId, userType, deviceId });
  },
};

export default fcmService;
