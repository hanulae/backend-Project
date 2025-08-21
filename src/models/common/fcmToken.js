import { Sequelize, DataTypes } from 'sequelize';

class FcmToken extends Sequelize.Model {
  static init(sequelize) {
    return super.init(
      {
        fcmTokenId: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
          comment: 'FCM 토큰 고유 ID',
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          comment: '사용자 ID (manager, funeral, funeralStaff, admin)',
        },
        userType: {
          type: DataTypes.ENUM('manager', 'funeral', 'funeralStaff', 'admin'),
          allowNull: false,
          comment: '사용자 유형',
        },
        fcmToken: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: 'FCM 토큰',
        },
        deviceId: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: '디바이스 고유 ID',
        },
        deviceType: {
          type: DataTypes.ENUM('ios', 'android'),
          allowNull: false,
          comment: '사용자 디바이스 플랫폼 정보',
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: '토큰 활성 여부',
        },
        lastUsedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          allowNull: false,
          comment: '마지막 사용 시간',
        },
        notificationEnabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: '앱 알림 수신 여부',
        },
        smsNotificationEnabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          allowNull: false,
          comment: 'SMS 알림 수신 여부',
        },
      },
      {
        sequelize,
        modelName: 'FcmToken',
        tableName: 'fcm_tokens',
        underscored: true,
        timestamps: true,
        paranoid: false,
        comment: 'FCM 토큰 관리 테이블',
        indexes: [
          {
            fields: ['user_id', 'user_type'],
            name: 'idx_fcm_token_user',
          },
          {
            fields: ['fcm_token'],
            name: 'idx_fcm_token_token',
            unique: true,
          },
          {
            fields: ['is_active'],
            name: 'idx_fcm_token_active',
          },
        ],
      },
    );
  }
}

export default FcmToken;
