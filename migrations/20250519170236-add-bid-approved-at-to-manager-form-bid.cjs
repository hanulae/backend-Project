'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('manager_form_bids', 'bid_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '장례식장이 출동신청을 승인한 시간',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('manager_form_bids', 'bid_approved_at');
  },
};
