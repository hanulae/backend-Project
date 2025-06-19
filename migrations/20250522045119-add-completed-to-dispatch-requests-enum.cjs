'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // PostgreSQL에서는 enum 타입에 값을 추가하기 위해 raw query 사용
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_dispatch_requests_is_approved ADD VALUE IF NOT EXISTS 'completed';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL에서는 enum에서 값을 제거하는 것이 복잡하므로 down 메소드는 비워둠
    // 필요한 경우 테이블 및 enum 타입을 다시 만들어야 함
  },
};
