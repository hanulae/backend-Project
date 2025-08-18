/**
 * 파일명: notificationHistoryDao.js
 * 설명: 알림 이력 관련 데이터베이스 접근 객체
 * 사용자에게 전송된 알림의 생성, 조회, 관리 및 통계 기능을 제공합니다.
 */

import db from '../../models/index.js';
import logger from '../../config/logger.js';
import { sequelize } from '../../config/database.js';
import { Op } from 'sequelize';

const notificationHistoryDao = {
  /**
   * 알림 생성
   *
   * 새로운 알림을 생성하여 데이터베이스에 저장합니다.
   * 알림의 수신자, 송신자, 내용 등의 정보를 포함합니다.
   *
   * @param {Object} notificationData - 알림 데이터 객체
   *   @param {string} notificationData.receiverId - 수신자 ID
   *   @param {string} notificationData.receiverType - 수신자 유형 ('funeral', 'manager', 'admin' 등)
   *   @param {string} [notificationData.senderId] - 송신자 ID (없으면 null)
   *   @param {string} [notificationData.senderType] - 송신자 유형 (기본값: 'system')
   *   @param {string} notificationData.notificationType - 알림 유형
   *   @param {string} notificationData.title - 알림 제목
   *   @param {string} notificationData.body - 알림 내용
   *   @param {Object} [notificationData.data] - 추가 데이터 (없으면 null)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Object>} 생성된 알림 객체
   * @throws {Error} 알림 생성 실패 시 발생
   */
  async createNotification(notificationData, options = {}) {
    try {
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
   *
   * 특정 사용자의 알림 목록을 페이지네이션을 적용하여 조회합니다.
   * 읽지 않은 알림만 필터링하는 옵션을 제공합니다.
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   * @param {Object} options - 페이징 및 필터링 옵션
   *   @param {number} [options.page=1] - 페이지 번호
   *   @param {number} [options.limit=20] - 페이지당 개수
   *   @param {boolean} [options.unreadOnly=false] - 읽지 않은 알림만 조회 여부
   * @returns {Promise<Object>} count(총 개수)와 rows(알림 객체 배열)를 포함한 객체
   * @throws {Error} 조회 실패 시 발생
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
   *
   * 특정 알림을 읽음 상태로 처리합니다.
   * 알림의 소유자인 사용자만 읽음 처리할 수 있습니다.
   *
   * @param {string} notificationId - 알림 ID
   * @param {string} userId - 사용자 ID
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 읽음 처리 실패 시 발생
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
   *
   * 특정 사용자의 모든 읽지 않은 알림을 읽음 상태로 처리합니다.
   * 읽지 않은 알림을 한번에 모두 읽음 처리할 때 사용됩니다.
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<[number]>} 영향받은 행 수를 포함하는 배열
   * @throws {Error} 읽음 처리 실패 시 발생
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
   *
   * 특정 알림 ID로 알림 정보를 조회합니다.
   *
   * @param {string} notificationId - 알림 ID
   * @returns {Promise<Object|null>} 알림 객체 또는 없을 경우 null
   * @throws {Error} 조회 실패 시 발생
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
   *
   * 특정 사용자의 읽지 않은 알림 수를 조회합니다.
   * 읽지 않은 알림 발신 분서나 알림 받은 표시 등에 사용됩니다.
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   * @returns {Promise<number>} 읽지 않은 알림 수
   * @throws {Error} 조회 실패 시 발생
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
   *
   * 지정된 기간(기본값: 90일) 이전에 생성된 모든 알림을 삭제합니다.
   * 정기적인 정리 작업에 사용됩니다.
   *
   * @param {number} daysAgo - 이 일수보다 오래된 알림을 삭제 (기본값: 90일)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<number>} 삭제된 행 수
   * @throws {Error} 삭제 실패 시 발생
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
   *
   * 특정 사용자의 알림 타입별 통계를 조회합니다.
   * 지정된 기간 내의 알림을 타입별로 그룹화하여 통계를 제공합니다.
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   * @param {Date} startDate - 시작 날짜
   * @param {Date} endDate - 종료 날짜
   * @returns {Promise<Array<Object>>} 알림 타입별 통계 객체 배열
   * @throws {Error} 통계 조회 실패 시 발생
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
   *
   * 지정된 날짜 이전에 읽은 알림들을 모두 삭제합니다.
   * 읽은 알림만 삭제하여 읽지 않은 알림은 보존합니다.
   * 실제 삭제(force: true)를 사용하여 데이터베이스에서 영구적으로 삭제합니다.
   *
   * @param {Date} beforeDate - 이 날짜 이전에 읽은 알림들을 삭제
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<number>} 삭제된 행 수
   * @throws {Error} 삭제 실패 시 발생
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
   *
   * 최근 7일간의 알림 통계를 생성합니다.
   * 전체 발송 수, 읽은 알림 수, 읽음률 및 타입별 통계를 포함합니다.
   * 관리자 대시보드 등에 사용됩니다.
   *
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Object>} 주간 알림 통계 객체
   * @throws {Error} 통계 생성 실패 시 발생
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
   *
   * 특정 사용자의 알림 통계를 조회합니다.
   * 지정된 기간(기본값: 30일) 내의 알림을 타입별로 분석하여 전체, 읽은, 읽지 않은 알림 수와 읽음률을 제공합니다.
   * 사용자 프로필이나 통계 화면에 사용됩니다.
   *
   * @param {string} userId - 사용자 ID
   * @param {string} userType - 사용자 유형 ('funeral', 'manager', 'admin' 등)
   * @param {number} days - 조회 기간(일) (기본값: 30일)
   * @param {Object} options - 추가 옵션 객체
   *   @param {Transaction} [options.transaction] - Sequelize 트랜잭션 객체
   * @returns {Promise<Array<Object>>} 사용자 알림 통계 객체 배열
   * @throws {Error} 통계 조회 실패 시 발생
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
