'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fcm_tokens', 'notification_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '앱 알림 허용 여부',
    });

    await queryInterface.addColumn('fcm_tokens', 'sms_notification_enabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'SMS 알림 허용 여부',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('fcm_tokens', 'notification_enabled');
    await queryInterface.removeColumn('fcm_tokens', 'sms_notification_enabled');
  },
};
