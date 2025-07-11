import db from '../../models/index.js';
import logger from '../../config/logger.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';

const notificationHistoryDao = {
  /**
   * 알림 생성
   */
  async createNotification(notificationData, options = {}) {
    try {
      console.log('🚀 ~ createNotification ~ notificationData:', notificationData);
      return await db.NotificationHistory.create(
        {
          receiverId: notificationData.receiverId,
          receiverType: notificationData.receiverType,
          senderId: notificationData.senderId || null,
          senderType: notificationData.senderType || 'system',
          notificationType: notificationData.notificationType,
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data || null,
          sentAt: new Date(),
        },
        options,
      );
    } catch (error) {
      logger.error('알림 생성 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 사용자 알림 목록 조회 (페이징)
   */
  async findNotificationsByUser(
    userId,
    userType,
    { page = 1, limit = 20, unreadOnly = false } = {},
  ) {
    try {
      const whereClause = {
        receiverId: userId,
        receiverType: userType,
      };

      if (unreadOnly) {
        whereClause.isRead = false;
      }

      return await db.NotificationHistory.findAndCountAll({
        where: whereClause,
        order: [['sentAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      });
    } catch (error) {
      logger.error('사용자 알림 목록 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId, userId, options = {}) {
    try {
      return await db.NotificationHistory.update(
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          where: {
            notificationId,
            receiverId: userId,
            isRead: false,
          },
          ...options,
        },
      );
    } catch (error) {
      logger.error('알림 읽음 처리 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 사용자의 모든 알림 읽음 처리
   */
  async markAllAsRead(userId, userType, options = {}) {
    try {
      return await db.NotificationHistory.update(
        {
          isRead: true,
          readAt: new Date(),
        },
        {
          where: {
            receiverId: userId,
            receiverType: userType,
            isRead: false,
          },
          ...options,
        },
      );
    } catch (error) {
      logger.error('전체 알림 읽음 처리 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 알림 ID로 조회
   */
  async findById(notificationId) {
    try {
      return await db.NotificationHistory.findByPk(notificationId);
    } catch (error) {
      logger.error('알림 ID 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 읽지 않은 알림 수 조회
   */
  async countUnreadByUser(userId, userType) {
    try {
      return await db.NotificationHistory.count({
        where: {
          receiverId: userId,
          receiverType: userType,
          isRead: false,
        },
      });
    } catch (error) {
      logger.error('읽지 않은 알림 수 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 특정 기간 이전 알림 삭제 (정리 작업용)
   */
  async deleteOldNotifications(daysAgo = 90, options = {}) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

      return await db.NotificationHistory.destroy({
        where: {
          sentAt: {
            [sequelize.Op.lt]: cutoffDate,
          },
        },
        ...options,
      });
    } catch (error) {
      logger.error('오래된 알림 삭제 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 알림 타입별 통계 조회
   */
  async getNotificationStats(userId, userType, startDate, endDate) {
    try {
      return await db.NotificationHistory.findAll({
        attributes: [
          'notificationType',
          [sequelize.fn('COUNT', sequelize.col('notification_id')), 'count'],
        ],
        where: {
          receiverId: userId,
          receiverType: userType,
          sentAt: {
            [sequelize.Op.between]: [startDate, endDate],
          },
        },
        group: ['notificationType'],
        order: [[sequelize.literal('count'), 'DESC']],
      });
    } catch (error) {
      logger.error('알림 통계 조회 DAO 오류:', error);
      throw error;
    }
  },

  /**
   * 지정된 날짜 이전의 읽은 알림들을 삭제
   */
  async deleteOldReadNotifications(beforeDate, options = {}) {
    try {
      const deletedCount = await db.NotificationHistory.destroy({
        where: {
          isRead: true,
          readAt: {
            [Op.lt]: beforeDate,
          },
        },
        force: true, // 실제 삭제 (soft delete 아님)
        ...options,
      });

      logger.info(`${deletedCount}개의 오래된 알림이 삭제되었습니다.`);
      return deletedCount;
    } catch (error) {
      logger.error('오래된 알림 삭제 실패:', error);
      throw error;
    }
  },

  /**
   * 주간 알림 통계 생성
   */
  async getWeeklyNotificationStats(options = {}) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 전체 발송 수
      const totalSent = await db.NotificationHistory.count({
        where: {
          sentAt: {
            [Op.gte]: sevenDaysAgo,
          },
        },
        ...options,
      });

      // 읽은 알림 수
      const totalRead = await db.NotificationHistory.count({
        where: {
          sentAt: {
            [Op.gte]: sevenDaysAgo,
          },
          isRead: true,
        },
        ...options,
      });

      // 알림 타입별 통계
      const typeStats = await db.NotificationHistory.findAll({
        attributes: [
          'notificationType',
          [sequelize.fn('COUNT', sequelize.col('notificationId')), 'count'],
          [
            sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isRead" = true THEN 1 END')),
            'readCount',
          ],
        ],
        where: {
          sentAt: {
            [Op.gte]: sevenDaysAgo,
          },
        },
        group: ['notificationType'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 10,
        raw: true,
        ...options,
      });

      const readRate = totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(2) : 0;

      return {
        period: '최근 7일',
        totalSent,
        totalRead,
        readRate: `${readRate}%`,
        topNotificationTypes: typeStats.map((stat) => ({
          type: stat.notificationType,
          sent: parseInt(stat.count),
          read: parseInt(stat.readCount || 0),
          readRate:
            stat.count > 0 ? `${(((stat.readCount || 0) / stat.count) * 100).toFixed(1)}%` : '0%',
        })),
      };
    } catch (error) {
      logger.error('주간 알림 통계 생성 실패:', error);
      throw error;
    }
  },

  /**
   * 사용자별 알림 통계 조회
   */
  async getUserNotificationStats(userId, userType, days = 30, options = {}) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await db.NotificationHistory.findAll({
        attributes: [
          'notificationType',
          [sequelize.fn('COUNT', sequelize.col('notificationId')), 'total'],
          [
            sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isRead" = true THEN 1 END')),
            'read',
          ],
        ],
        where: {
          receiverId: userId,
          receiverType: userType,
          sentAt: {
            [Op.gte]: startDate,
          },
        },
        group: ['notificationType'],
        order: [[sequelize.literal('total'), 'DESC']],
        raw: true,
        ...options,
      });

      return stats.map((stat) => ({
        notificationType: stat.notificationType,
        total: parseInt(stat.total),
        read: parseInt(stat.read || 0),
        unread: parseInt(stat.total) - parseInt(stat.read || 0),
        readRate: stat.total > 0 ? `${(((stat.read || 0) / stat.total) * 100).toFixed(1)}%` : '0%',
      }));
    } catch (error) {
      logger.error('사용자 알림 통계 조회 실패:', error);
      throw error;
    }
  },
};

export default notificationHistoryDao;
