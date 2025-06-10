'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('transaction_lists', 'manager_transaction_completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '상조팀장 거래완료 확인 시간',
    });

    await queryInterface.addColumn('transaction_lists', 'funeral_transaction_completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '장례식장 거래완료 확인 시간',
    });

    await queryInterface.addColumn('transaction_lists', 'transaction_completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '거래 최종 완료 시간',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('transaction_lists', 'manager_transaction_completed_at');
    await queryInterface.removeColumn('transaction_lists', 'funeral_transaction_completed_at');
    await queryInterface.removeColumn('transaction_lists', 'transaction_completed_at');
  },
};
