'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('manager_form_bids', 'discount', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: '할인률',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('manager_form_bids', 'discount', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '할인률',
    });
  },
};
