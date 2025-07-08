import { Sequelize, DataTypes } from 'sequelize';

class NotificationHistory extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        notificationId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          comment: '알림 고유 ID',
        },
        receiverId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '수신자 ID',
        },
        receiverType: {
          type: DataTypes.ENUM('manager', 'funeral', 'funeralStaff', 'admin'),
          allowNull: false,
          comment: '수신자 유형',
        },
        senderId: {
          type: DataTypes.UUID,
          allowNull: true,
          comment: '발신자 ID (시스템 알림일 경우 Null)',
        },
        senderType: {
          type: DataTypes.ENUM('manager', 'funeral', 'funeralStaff', 'admin', 'system'),
          allowNull: false,
          defaultValue: 'system',
          comment: '발신자 타입',
        },
        notificationType: {
          type: DataTypes.ENUM(
            'manager_form_created', // 견적서 작성 신청
            'bid_submitted', // 입찰 제안
            'dispatch_requested', // 출동 신청
            'dispatch_approved', // 출동 승인
            'dispatch_cancelled', // 출동 취소
            'dispatch_rejected', // 출동 거절
            'transaction_completed_requested', // 거래 완료 요청
            'transaction_completed', // 거래 완료
            'cash_refund_requested', // 환급 요청
            'cash_refund_approved', // 환급 승인
            'cash_refund_rejected', // 환급 거절
            'account_approved', // 계정 승인
            'point_granted', // 포인트 지급
            'cash_granted', // 캐시 지급
          ),
          allowNull: false,
          comment: '알림 타입',
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '알림 제목',
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: '알림 내용',
        },
        data: {
          type: DataTypes.JSONB,
          allowNull: true,
          comment: '추가 데이터 (JSON 형태)',
        },
        isRead: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: false,
          comment: '읽음 상태',
        },
        sentAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false,
          comment: '발송 시간',
        },
        readAt: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: '읽은 시간',
        },
      },
      {
        sequelize,
        modelName: 'NotificationHistory',
        tableName: 'notification_history',
        underscored: true,
        timestamps: true,
        paranoid: false,
        comment: '알림 이력 테이블',
        indexes: [
          {
            fields: ['receiver_id', 'receiver_type'],
            name: 'idx_notification_receiver',
          },
          {
            fields: ['notification_type'],
            name: 'idx_notification_type',
          },
          {
            fields: ['is_read'],
            name: 'idx_notification_read',
          },
          {
            fields: ['sent_at'],
            name: 'idx_notification_sent_at',
          },
        ],
      },
    );
  }
}

export default NotificationHistory;
