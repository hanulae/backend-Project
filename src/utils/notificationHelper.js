import coolsms from 'coolsms-node-sdk';
import fcmService from '../services/common/fcmService.js';
import logger from '../config/logger.js';
import fcmTokenDao from '../dao/common/fcmTokenDao.js';

const client = new coolsms.default(process.env.COOLSMS_API_KEY, process.env.COOLSMS_API_SECRET);

/**
 * 알림 설정에 따라 앱 알림과 SMS를 선택적으로 전송하는 헬퍼 함수
 *
 * @param {Object} params - 알림 전송 파라미터
 * @param {string} params.receiverId - 수신자 ID
 * @param {string} params.receiverType - 수신자 타입 ('manager', 'funeral' 등)
 * @param {string} params.notificationType - 알림 타입
 * @param {Object} params.data - 알림 데이터
 * @param {string} params.senderId - 발신자 ID
 * @param {string} params.senderType - 발신자 타입
 * @param {Object} params.smsParams - SMS 전송 파라미터
 * @param {string} params.smsParams.phoneNumber - 수신자 전화번호
 * @param {string} params.smsParams.message - SMS 내용
 * @returns {Promise<Object>} 알림 전송 결과
 */
export async function sendNotificationBasedOnSettings(params) {
  const { receiverId, receiverType, notificationType, data, senderId, senderType, smsParams } =
    params;

  try {
    // 수신자의 알림 설정 조회
    const notificationSettings = await fcmService.getNotificationSettings(receiverId, receiverType);
    const results = { appNotification: null, smsNotification: null };

    // 앱 알림 설정이 켜져 있으면 FCM 알림 전송
    if (notificationSettings.notificationEnabled) {
      results.appNotification = await fcmService.sendNotificationToUser({
        receiverId,
        receiverType,
        notificationType,
        data,
        senderId,
        senderType,
      });
      logger.info(`${notificationType} 앱 알림 전송 성공: ${receiverType} ${receiverId}`);
    } else {
      logger.info(`${receiverType} ${receiverId}의 앱 알림 설정이 꺼져 있어 알림을 전송하지 않음`);
    }

    // SMS 알림 설정이 켜져 있고 SMS 파라미터가 제공된 경우 문자 전송
    if (notificationSettings.smsNotificationEnabled && smsParams) {
      results.smsNotification = await client.sendOne({
        to: smsParams.phoneNumber,
        from: process.env.COOLSMS_SENDER_NUMBER,
        text: smsParams.message,
      });
      logger.info(`${notificationType} SMS 전송 성공: ${receiverType} ${receiverId}`);
    } else if (smsParams) {
      logger.info(`${receiverType} ${receiverId}의 SMS 알림 설정이 꺼져 있어 문자를 전송하지 않음`);
    }

    return results;
  } catch (error) {
    logger.error(`알림 전송 실패: ${receiverType} ${receiverId}`, error);
    throw error;
  }
}

/**
 * 장례식장 그룹(대표 + 직원들)에게 알림 설정에 따라 앱 알림과 SMS를 선택적으로 전송
 *
 * @param {Object} params - 알림 전송 파라미터
 * @param {string} params.funeralId - 장례식장 ID
 * @param {string} params.notificationType - 알림 타입
 * @param {Object} params.data - 알림 데이터
 * @param {string} params.senderId - 발신자 ID
 * @param {string} params.senderType - 발신자 타입
 * @param {Object} params.smsParams - SMS 전송 파라미터
 * @param {string} params.smsParams.message - SMS 내용
 * @returns {Promise<Object>} 알림 전송 결과
 */
export async function sendNotificationToFuneralGroupBasedOnSettings(params) {
  const { funeralId, notificationType, data, senderId, senderType, smsParams } = params;
  const results = {
    appNotifications: { success: 0, failed: 0, disabled: 0 },
    smsNotifications: { success: 0, failed: 0, disabled: 0 },
  };

  try {
    // 1. 장례식장 그룹의 사용자 정보 조회 (대표 + 직원들)
    const groupUsers = await fcmTokenDao.findFuneralGroupUsers(funeralId);

    // 2. 각 사용자별로 알림 설정 확인 및 알림 전송
    for (const user of groupUsers) {
      try {
        // 사용자의 알림 설정 조회
        const notificationSettings = await fcmService.getNotificationSettings(
          user.userId,
          user.userType,
        );

        // 앱 알림 설정이 켜져 있으면 FCM 알림 전송
        if (notificationSettings.notificationEnabled) {
          await fcmService.sendNotificationToUser({
            receiverId: user.userId,
            receiverType: user.userType,
            notificationType,
            data,
            senderId,
            senderType,
          });
          results.appNotifications.success++;
          logger.info(
            `${notificationType} 앱 알림 전송 성공: ${user.userType} ${user.userId} (${user.name})`,
          );
        } else {
          results.appNotifications.disabled++;
          logger.info(
            `${user.userType} ${user.userId} (${user.name})의 앱 알림 설정이 꺼져 있어 알림을 전송하지 않음`,
          );
        }

        // SMS 알림 설정이 켜져 있고 전화번호가 있는 경우 문자 전송
        if (notificationSettings.smsNotificationEnabled && smsParams && user.phoneNumber) {
          await client.sendOne({
            to: user.phoneNumber,
            from: process.env.COOLSMS_SENDER_NUMBER,
            text: smsParams.message,
          });
          results.smsNotifications.success++;
          logger.info(
            `${notificationType} SMS 전송 성공: ${user.userType} ${user.userId} (${user.name})`,
          );
        } else if (smsParams && user.phoneNumber) {
          results.smsNotifications.disabled++;
          logger.info(
            `${user.userType} ${user.userId} (${user.name})의 SMS 알림 설정이 꺼져 있어 문자를 전송하지 않음`,
          );
        }
      } catch (userError) {
        logger.error(
          `사용자 ${user.userType} ${user.userId} (${user.name})에 대한 알림 전송 실패:`,
          userError,
        );
        results.appNotifications.failed++;
        if (smsParams) results.smsNotifications.failed++;
      }
    }

    return {
      success: true,
      results,
      targetUsers: groupUsers.length,
    };
  } catch (error) {
    logger.error(`장례식장 그룹 알림 전송 실패: 장례식장 ${funeralId}`, error);
    throw error;
  }
}
