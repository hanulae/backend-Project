'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('manager_cash_histories', 'funeral_id', {
      type: Sequelize.UUID,
      allowNull: true,
      comment: '거래한 장례식장의 고유 ID (FK)',
    });
    await queryInterface.removeColumn('manager_cash_histories', 'funeral_list_id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('manager_cash_histories', 'funeral_id');
  },
};
