'use strict';

module.exports = {
  async up(queryInterface, S) {
    await queryInterface.addColumn('LocationEvents', 'reviewNote', {
      type: S.TEXT, allowNull: false, defaultValue: '',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('LocationEvents', 'reviewNote');
  },
};
