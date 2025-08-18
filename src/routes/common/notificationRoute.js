/**
 * 파일명: notificationRoute.js
 * 설명: FCM 토큰 관리 및 알림 조회/읽음/통계 처리 API 제공
 */
import express from 'express';
import fcmService from '../../services/common/fcmService.js';
import notificationHistoryDao from '../../dao/common/notificationHistoryDao.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/common/notification/fcm/token
 * @desc FCM 토큰 등록/갱신
 * @access Private
 * @param {Object} req.body
 * @param {string} req.body.fcmToken - FCM 토큰
 * @param {string} req.body.deviceId - 기기 ID
 * @param {string} req.body.deviceType - 기기 타입
 * @returns {Object} 200 { message, data } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.post('/fcm/token', authMiddleware, async (req, res) => {
  try {
    const { fcmToken, deviceId, deviceType } = req.body;
    const { userId, userType } = req.user; // authMiddleware에서 추출

    if (!fcmToken || !deviceId || !deviceType) {
      return res.status(400).json({
        message: 'FCM 토큰, 기기 ID, 기기 타입은 필수입니다.',
      });
    }

    const result = await fcmService.registerToken({
      userId,
      userType,
      fcmToken,
      deviceId,
      deviceType,
    });

    res.status(200).json({
      message: 'FCM 토큰이 등록되었습니다.',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route POST /api/common/notification/fcm/deactivate
 * @desc FCM 토큰 비활성화(로그아웃)
 * @access Private
 * @param {Object} req.body
 * @param {string} req.body.deviceId - 기기 ID
 * @returns {Object} 200 { message, data } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.post('/fcm/deactivate', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const { userId, userType } = req.user;

    const result = await fcmService.deactivateUserTokens({
      userId,
      userType,
      deviceId, // 특정 기기만 비활성화하거나 전체 비활성화
    });

    res.status(200).json({
      message: 'FCM 토큰이 비활성화되었습니다.',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route GET /api/common/notification/list
 * @desc 알림 목록 조회
 * @access Private
 * @param {Object} req.query
 * @param {number} req.query.page - 페이지 번호
 * @param {number} req.query.limit - 페이지 당 항목 수
 * @param {string} req.query.type - 알림 타입
 * @param {string} req.query.unreadOnly - 읽지 않은 알림만 조회 여부
 * @returns {Object} 200 { message, data } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { page = 1, limit = 20, type, unreadOnly } = req.query;

    const result = await notificationHistoryDao.findNotificationsByUser(userId, userType, {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type || null,
      unreadOnly: unreadOnly === 'true',
    });

    res.status(200).json({
      message: '알림 목록 조회 성공',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route PUT /api/common/notification/:notificationId/read
 * @desc 알림 단건 읽음 처리
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.userId - 사용자 ID
 * @param {string} req.user.userType - 사용자 타입
 * @returns {Object} 200 { message, data } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.put('/:notificationId/read', authMiddleware, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId, userType } = req.user;

    const result = await notificationHistoryDao.markAsRead(notificationId, userId, userType);

    res.status(200).json({
      message: '알림 읽음 처리 완료',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route PUT /api/common/notification/read-all
 * @desc 모든 알림 읽음 처리
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.userId - 사용자 ID
 * @param {string} req.user.userType - 사용자 타입
 * @returns {Object} 200 { message, data } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;

    const result = await notificationHistoryDao.markAllAsRead(userId, userType);

    res.status(200).json({
      message: '모든 알림 읽음 처리 완료',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route GET /api/common/notification/badge-count
 * @desc 읽지 않은 알림 수(배지 카운트)
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.userId - 사용자 ID
 * @param {string} req.user.userType - 사용자 타입
 * @returns {Object} 200 { message, data: { unreadCount:number } } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.get('/badge-count', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;

    const unreadCount = await notificationHistoryDao.countUnreadByUser(userId, userType);

    res.status(200).json({
      message: '배지 카운트 조회 성공',
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route POST /api/common/notification/badge-reset
 * @desc 배지 초기화(=모든 알림 읽음 처리)
 * @access Private
 * @param {Object} req.user
 * @param {string} req.user.userId - 사용자 ID
 * @param {string} req.user.userType - 사용자 타입
 * @returns {Object} 200 { message, data: { affectedRows:number } } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.post('/badge-reset', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;

    // 읽지 않은 알림을 모두 읽음 처리
    const result = await notificationHistoryDao.markAllAsRead(userId, userType);

    res.status(200).json({
      message: '배지 초기화 완료',
      data: {
        affectedRows: result[0], // 업데이트된 행의 개수
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @route GET /api/common/notification/stats
 * @desc 기간별 알림 통계
 * @access Private
 * @param {Object} req.query
 * @param {string} req.query.startDate - 시작 날짜
 * @param {string} req.query.endDate - 종료 날짜
 * @returns {Object} 200 { message, data } 400 - 잘못된 요청
 * @throws {Error} 500 - 서버 오류
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { startDate, endDate } = req.query;

    const result = await notificationHistoryDao.getNotificationStats(
      userId,
      userType,
      startDate,
      endDate,
    );

    res.status(200).json({
      message: '알림 통계 조회 성공',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
