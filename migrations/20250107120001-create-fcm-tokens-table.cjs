'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 FCM 토큰 테이블 생성 마이그레이션 시작...');

    try {
      // 1. 테이블 존재 여부 확인
      const tableExists = await queryInterface.describeTable('fcm_tokens').catch(() => null);
      if (tableExists) {
        console.log('⚠️ fcm_tokens 테이블이 이미 존재합니다. 마이그레이션을 건너뜁니다.');
        return;
      }

      console.log('📋 fcm_tokens 테이블 생성 중...');

      // 2. FCM 토큰 테이블 생성
      await queryInterface.createTable(
        'fcm_tokens',
        {
          fcm_token_id: {
            type: Sequelize.UUID,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            allowNull: false,
            comment: 'FCM 토큰 고유 ID',
          },
          user_id: {
            type: Sequelize.UUID,
            allowNull: false,
            comment: '사용자 ID (manager/funeral/funeralStaff/admin)',
          },
          user_type: {
            type: Sequelize.ENUM('manager', 'funeral', 'funeralStaff', 'admin'),
            allowNull: false,
            comment: '사용자 타입',
          },
          fcm_token: {
            type: Sequelize.TEXT,
            allowNull: false,
            comment: 'FCM 토큰 값',
          },
          device_id: {
            type: Sequelize.STRING(100),
            allowNull: false,
            comment: '기기 고유 ID',
          },
          device_type: {
            type: Sequelize.ENUM('android', 'ios', 'web'),
            allowNull: false,
            comment: '기기 타입',
          },
          is_active: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false,
            comment: '활성 상태',
          },
          last_used_at: {
            type: Sequelize.DATE,
            allowNull: true,
            comment: '마지막 사용 시간',
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
          tableName: 'fcm_tokens',
          timestamps: true,
          underscored: true,
          comment: 'FCM 토큰 관리 테이블',
        },
      );

      // 3. 인덱스 생성
      await queryInterface.addIndex('fcm_tokens', ['user_id', 'user_type'], {
        name: 'idx_fcm_tokens_user',
        comment: '사용자별 FCM 토큰 조회 인덱스',
      });

      await queryInterface.addIndex('fcm_tokens', ['device_id'], {
        name: 'idx_fcm_tokens_device',
        comment: '기기 ID별 FCM 토큰 조회 인덱스',
      });

      await queryInterface.addIndex('fcm_tokens', ['is_active'], {
        name: 'idx_fcm_tokens_active',
        comment: '활성 상태별 FCM 토큰 조회 인덱스',
      });

      console.log('✅ FCM 토큰 테이블 생성 완료!');
    } catch (error) {
      console.error('❌ FCM 토큰 테이블 생성 실패:', error);
      throw error;
    }
  },

  async down(queryInterface, _Sequelize) {
    try {
      console.log('🔄 FCM 토큰 테이블 삭제 중...');

      // 테이블 존재 여부 확인
      const tableExists = await queryInterface.describeTable('fcm_tokens').catch(() => null);
      if (!tableExists) {
        console.log('⚠️ fcm_tokens 테이블이 존재하지 않습니다.');
        return;
      }

      // 테이블 삭제
      await queryInterface.dropTable('fcm_tokens');

      console.log('✅ FCM 토큰 테이블 삭제 완료!');
    } catch (error) {
      console.error('❌ FCM 토큰 테이블 삭제 실패:', error);
      throw error;
    }
  },
};
