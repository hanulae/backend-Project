'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // PostgreSQL에서 enum 타입에 값을 추가
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_transaction_lists_status ADD VALUE IF NOT EXISTS 'reserved';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL에서는 enum에서 값을 제거하는 것이 복잡하므로
    // 필요한 경우 테이블 및 enum 타입을 다시 만들어야 함
    console.log('Warning: Cannot remove enum value in PostgreSQL. Manual intervention required.');
  },
};
