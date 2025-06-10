'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // PostgreSQL에서는 enum 타입에 값을 추가하기 위해 raw query를 사용해야 함
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_manager_form_bids_bid_status ADD VALUE IF NOT EXISTS 'bid_progress';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // PostgreSQL에서는 enum에서 값을 제거하는 것이 복잡합니다.
    // 실제로 enum에서 값을 제거하려면 타입을 재생성해야 하므로 down 메소드는 비워둡니다.
    // 필요한 경우 테이블 및 enum 타입을 다시 만들어야 합니다.
  },
};
