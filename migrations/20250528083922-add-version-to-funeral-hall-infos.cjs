'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🚀 version 컬럼 추가 마이그레이션 시작...');

    try {
      // 1. 테이블 존재 여부 확인
      console.log('📋 테이블 구조 확인 중...');
      const tableDescription = await queryInterface.describeTable('funeral_hall_infos');

      // 2. version 컬럼이 이미 존재하는지 확인
      if (tableDescription.version) {
        console.log('⚠️ version 컬럼이 이미 존재합니다. 마이그레이션을 건너뜁니다.');
        return;
      }

      console.log('➕ version 컬럼 추가 중...');

      // 3. version 컬럼 추가
      await queryInterface.addColumn('funeral_hall_infos', 'version', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '낙관적 잠금을 위한 버전 번호',
      });

      console.log('✅ version 컬럼 추가 완료');

      // 4. 기존 데이터 확인
      console.log('📊 기존 데이터 확인 중...');
      const [results] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM funeral_hall_infos;',
      );

      const existingRecords = parseInt(results[0].count);
      console.log(`📊 기존 레코드 수: ${existingRecords}개`);

      // 5. 기존 데이터 초기화 (필요한 경우)
      if (existingRecords > 0) {
        console.log('🔄 기존 레코드 version 초기화 중...');
        await queryInterface.sequelize.query(`
          UPDATE funeral_hall_infos 
          SET version = 0 
          WHERE version IS NULL;
        `);
        console.log(`✅ ${existingRecords}개 기존 레코드의 version이 0으로 초기화되었습니다.`);
      }

      // 6. 인덱스 추가
      console.log('🔍 인덱스 추가 중...');
      await queryInterface.addIndex('funeral_hall_infos', {
        fields: ['funeral_hall_id', 'version'],
        name: 'idx_funeral_hall_infos_id_version',
        unique: false,
      });

      console.log('✅ 인덱스 추가 완료');
      console.log('🎉 version 컬럼 마이그레이션이 성공적으로 완료되었습니다!');
    } catch (error) {
      console.error('❌ 마이그레이션 실패:', error.message);
      console.error('상세 에러:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 version 컬럼 제거 마이그레이션 시작...');

    try {
      // 1. 인덱스 제거
      console.log('🗑️ 인덱스 제거 중...');
      try {
        await queryInterface.removeIndex('funeral_hall_infos', 'idx_funeral_hall_infos_id_version');
        console.log('✅ 인덱스 제거 완료');
      } catch (error) {
        console.log('⚠️ 인덱스가 존재하지 않거나 이미 제거되었습니다.');
      }

      // 2. version 컬럼 제거
      console.log('🗑️ version 컬럼 제거 중...');
      await queryInterface.removeColumn('funeral_hall_infos', 'version');
      console.log('✅ version 컬럼 제거 완료');

      console.log('🎉 version 컬럼 롤백이 성공적으로 완료되었습니다!');
    } catch (error) {
      console.error('❌ 롤백 실패:', error.message);
      throw error;
    }
  },
};
