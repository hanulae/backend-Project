'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 알림 이력 테이블 생성 마이그레이션 시작...');

    try {
      // 1. 테이블 존재 여부 확인
      const tableExists = await queryInterface
        .describeTable('notification_history')
        .catch(() => null);
      if (tableExists) {
        console.log('⚠️ notification_history 테이블이 이미 존재합니다. 마이그레이션을 건너뜁니다.');
        return;
      }

      console.log('📋 notification_history 테이블 생성 중...');

      // 2. 알림 이력 테이블 생성
      await queryInterface.createTable(
        'notification_history',
        {
          notification_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
            comment: '알림 고유 ID',
          },
          receiver_id: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: '수신자 ID',
          },
          receiver_type: {
            type: Sequelize.ENUM('manager', 'funeral', 'funeralStaff', 'admin'),
            allowNull: false,
            comment: '수신자 타입',
          },
          sender_id: {
            type: Sequelize.UUID,
            allowNull: true,
            comment: '발신자 ID (시스템 알림의 경우 null)',
          },
          sender_type: {
            type: Sequelize.ENUM('manager', 'funeral', 'funeralStaff', 'admin', 'system'),
            allowNull: false,
            defaultValue: 'system',
            comment: '발신자 타입',
          },
          notification_type: {
            type: Sequelize.STRING(50),
            allowNull: false,
            comment: '알림 타입 (bid_submitted, dispatch_approved 등)',
          },
          title: {
            type: Sequelize.STRING(255),
            allowNull: false,
            comment: '알림 제목',
          },
          body: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: '알림 내용',
          },
          data: {
            type: Sequelize.JSON,
            allowNull: true,
            comment: '추가 데이터 (JSON 형태)',
          },
          is_read: {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            comment: '읽음 여부',
          },
          read_at: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: '읽은 시간',
          },
          sent_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            comment: '발송 시간',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
          },
        },
        {
          tableName: 'notification_history',
          timestamps: true,
          underscored: true,
          comment: '알림 이력 관리 테이블',
        },
      );

      // 3. 인덱스 생성
      await queryInterface.addIndex('notification_history', ['receiver_id', 'receiver_type'], {
        name: 'idx_notification_history_receiver',
        comment: '수신자별 알림 조회 인덱스',
      });

      await queryInterface.addIndex('notification_history', ['notification_type'], {
        name: 'idx_notification_history_type',
        comment: '알림 타입별 조회 인덱스',
      });

      await queryInterface.addIndex('notification_history', ['is_read'], {
        name: 'idx_notification_history_read',
        comment: '읽음 여부별 조회 인덱스',
      });

      await queryInterface.addIndex('notification_history', ['sent_at'], {
        name: 'idx_notification_history_sent',
        comment: '발송 시간별 조회 인덱스',
      });

      console.log('✅ 알림 이력 테이블 생성 완료!');
    } catch (error) {
      console.error('❌ 알림 이력 테이블 생성 실패:', error);
      throw error;
    }
  },

  async down(queryInterface, _Sequelize) {
    try {
      console.log('🔄 알림 이력 테이블 삭제 중...');

      // 테이블 존재 여부 확인
      const tableExists = await queryInterface
        .describeTable('notification_history')
        .catch(() => null);
      if (!tableExists) {
        console.log('⚠️ notification_history 테이블이 존재하지 않습니다.');
        return;
      }

      // 테이블 삭제
      await queryInterface.dropTable('notification_history');

      console.log('✅ 알림 이력 테이블 삭제 완료!');
    } catch (error) {
      console.error('❌ 알림 이력 테이블 삭제 실패:', error);
      throw error;
    }
  },
};
