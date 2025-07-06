'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('funeral_staffs', 'funeralStaffPassword', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '장례식장 직원 비밀번호',
    });

    await queryInterface.addColumn('funeral_staffs', 'funeralMainPhoneNumber', {
      type: Sequelize.STRING(20),
      allowNull: false,
      comment: '장례식장 대표번호',
    });

    await queryInterface.sequelize.query(`
      UPDATE funeral_staffs SET funeralStaffPassword = 'defaultPassword' WHERE funeralStaffPassword IS NULL
    `);

    await queryInterface.changeColumn('funeral_staffs', 'funeralStaffPassword', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('funeral_staffs', 'funeralStaffPassword');
    await queryInterface.removeColumn('funeral_staffs', 'funeralMainPhoneNumber');
  }
};
