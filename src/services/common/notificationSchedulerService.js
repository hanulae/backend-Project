import cron from 'node-cron';
import logger from '../../config/logger.js';
import { sequelize } from '../../config/database.js';
import fcmTokenDao from '../../dao/common/fcmTokenDao.js';
import notificationHistoryDao from '../../dao/common/notificationHistoryDao.js';

class NotificationSchedulerService {
  static isSchedulerRunning = false;

  /**
   * 스케줄러 시작
   */
  static startScheduler() {
    if (this.isSchedulerRunning) {
      logger.warn('알림 스케줄러가 이미 실행 중입니다.');
      return;
    }

    // 매일 새벽 2시에 알림 정리 작업 실행
    cron.schedule('0 2 * * *', async () => {
      logger.info('알림 정리 스케줄러 시작');
      try {
        await this.cleanupOldNotifications();
        await this.cleanupInactiveFcmTokens();
        await this.updateTokenUsage();
        logger.info('알림 정리 스케줄러 완료');
      } catch (error) {
        logger.error('알림 정리 스케줄러 오류:', error);
      }
    });

    // 매주 월요일 새벽 3시에 통계 정리 작업 실행
    cron.schedule('0 3 * * 1', async () => {
      logger.info('알림 통계 정리 스케줄러 시작');
      try {
        await this.generateNotificationStats();
        logger.info('알림 통계 정리 스케줄러 완료');
      } catch (error) {
        logger.error('알림 통계 정리 스케줄러 오류:', error);
      }
    });

    this.isSchedulerRunning = true;
    logger.info('알림 스케줄러가 시작되었습니다.');
  }

  /**
   * 스케줄러 중지
   */
  static stopScheduler() {
    cron.destroy();
    this.isSchedulerRunning = false;
    logger.info('알림 스케줄러가 중지되었습니다.');
  }

  /**
   * 30일 이상 된 읽은 알림 삭제
   */
  static async cleanupOldNotifications() {
    const transaction = await sequelize.transaction();
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await notificationHistoryDao.deleteOldReadNotifications(thirtyDaysAgo, {
        transaction,
      });

      await transaction.commit();
      logger.info(`오래된 알림 ${deletedCount}건이 삭제되었습니다.`);
      return deletedCount;
    } catch (error) {
      await transaction.rollback();
      logger.error('오래된 알림 삭제 실패:', error);
      throw error;
    }
  }

  /**
   * 90일 이상 사용되지 않은 FCM 토큰 비활성화
   */
  static async cleanupInactiveFcmTokens() {
    const transaction = await sequelize.transaction();
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deactivatedCount = await fcmTokenDao.deactivateOldTokens(ninetyDaysAgo, {
        transaction,
      });

      await transaction.commit();
      logger.info(`비활성 FCM 토큰 ${deactivatedCount}건이 비활성화되었습니다.`);
      return deactivatedCount;
    } catch (error) {
      await transaction.rollback();
      logger.error('FCM 토큰 정리 실패:', error);
      throw error;
    }
  }

  /**
   * FCM 토큰 사용 시간 업데이트
   */
  static async updateTokenUsage() {
    try {
      // 최근 7일간 알림이 전송된 토큰들의 lastUsedAt 업데이트
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const updatedCount = await fcmTokenDao.updateRecentlyUsedTokens(sevenDaysAgo);

      logger.info(`FCM 토큰 사용 시간 ${updatedCount}건이 업데이트되었습니다.`);
      return updatedCount;
    } catch (error) {
      logger.error('FCM 토큰 사용 시간 업데이트 실패:', error);
      throw error;
    }
  }

  /**
   * 알림 통계 생성 (선택적 기능)
   */
  static async generateNotificationStats() {
    try {
      const stats = await notificationHistoryDao.getWeeklyNotificationStats();

      logger.info('주간 알림 통계:', {
        totalSent: stats.totalSent,
        totalRead: stats.totalRead,
        readRate: stats.readRate,
        topNotificationTypes: stats.topNotificationTypes,
      });

      return stats;
    } catch (error) {
      logger.error('알림 통계 생성 실패:', error);
      throw error;
    }
  }

  /**
   * 수동 정리 작업 실행
   */
  static async runManualCleanup() {
    logger.info('수동 알림 정리 작업 시작');
    try {
      const results = await Promise.allSettled([
        this.cleanupOldNotifications(),
        this.cleanupInactiveFcmTokens(),
        this.updateTokenUsage(),
      ]);

      const [notificationResult, tokenResult, usageResult] = results;

      return {
        notifications: notificationResult.status === 'fulfilled' ? notificationResult.value : 0,
        tokens: tokenResult.status === 'fulfilled' ? tokenResult.value : 0,
        usage: usageResult.status === 'fulfilled' ? usageResult.value : 0,
        errors: results.filter((r) => r.status === 'rejected').map((r) => r.reason),
      };
    } catch (error) {
      logger.error('수동 정리 작업 실패:', error);
      throw error;
    }
  }
}

export default NotificationSchedulerService;
