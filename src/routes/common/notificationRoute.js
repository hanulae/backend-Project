import express from 'express';
import fcmService from '../../services/common/fcmService.js';
import notificationHistoryDao from '../../dao/common/notificationHistoryDao.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

// FCM 토큰 등록/업데이트
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

// FCM 토큰 비활성화 (로그아웃 시)
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

// 알림 목록 조회
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const { userId, userType } = req.user;
    const { page = 1, limit = 20, type } = req.query;

    const result = await notificationHistoryDao.getNotificationsByUser(userId, userType, {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type || null,
    });

    res.status(200).json({
      message: '알림 목록 조회 성공',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 알림 읽음 처리
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

// 모든 알림 읽음 처리
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

// 알림 통계 조회
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

// 테스트용 알림 전송 (개발용)
router.post('/test-send', authMiddleware, async (req, res) => {
  try {
    const { receiverId, receiverType, title, body, data } = req.body;
    const { userId, userType } = req.user;

    if (!receiverId || !receiverType || !title || !body) {
      return res.status(400).json({
        message: '수신자 ID, 타입, 제목, 내용은 필수입니다.',
      });
    }

    const result = await fcmService.sendNotification({
      receiverId,
      receiverType,
      senderId: userId,
      senderType: userType,
      notificationType: 'test',
      title,
      body,
      data,
    });

    res.status(200).json({
      message: '테스트 알림 전송 완료',
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 개발용 테스트 API (인증 없음)
if (process.env.NODE_ENV === 'development') {
  // FCM 토큰 등록 (개발용)
  router.post('/dev/fcm/token', async (req, res) => {
    try {
      const result = await fcmService.registerToken(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // 테스트 알림 전송 (개발용)
  router.post('/dev/test-send', async (req, res) => {
    try {
      const result = await fcmService.sendNotificationToUser(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // 수동 정리 작업 실행 (개발용)
  router.post('/dev/cleanup', async (req, res) => {
    try {
      const NotificationSchedulerService = (
        await import('../../services/common/notificationSchedulerService.js')
      ).default;
      const result = await NotificationSchedulerService.runManualCleanup();
      res.json({
        success: true,
        message: '정리 작업이 완료되었습니다.',
        data: result,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 스케줄러 상태 조회 (개발용)
  router.get('/dev/scheduler/status', async (req, res) => {
    try {
      const NotificationSchedulerService = (
        await import('../../services/common/notificationSchedulerService.js')
      ).default;
      res.json({
        success: true,
        data: {
          isRunning: NotificationSchedulerService.isSchedulerRunning,
          status: NotificationSchedulerService.isSchedulerRunning ? 'running' : 'stopped',
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 주간 알림 통계 조회 (개발용)
  router.get('/dev/stats/weekly', async (req, res) => {
    try {
      const notificationHistoryDao = (await import('../../dao/common/notificationHistoryDao.js'))
        .default;
      const stats = await notificationHistoryDao.getWeeklyNotificationStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 사용자별 알림 통계 조회 (개발용)
  router.get('/dev/stats/user/:userId/:userType', async (req, res) => {
    try {
      const { userId, userType } = req.params;
      const { days = 30 } = req.query;

      const notificationHistoryDao = (await import('../../dao/common/notificationHistoryDao.js'))
        .default;
      const stats = await notificationHistoryDao.getUserNotificationStats(
        userId,
        userType,
        parseInt(days),
      );
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

export default router;
